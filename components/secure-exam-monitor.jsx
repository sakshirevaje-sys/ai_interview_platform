"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const WARNING_TEXT = {
  TAB_SWITCH: "Tab switching detected. Stay on the exam tab.",
  WINDOW_MINIMIZED: "Window minimization detected.",
  WINDOW_FOCUS_LOST: "Window focus was lost.",
  FULLSCREEN_EXIT: "Fullscreen exit detected.",
  PAGE_CLOSE_ATTEMPT: "Page close attempt detected.",
};

export default function SecureExamMonitor({ userId, testId, onAutoSubmit, onLock }) {
  const [violationCount, setViolationCount] = useState(0);
  const [maxViolations, setMaxViolations] = useState(3);
  const [warningMessage, setWarningMessage] = useState("");
  const [showWarning, setShowWarning] = useState(false);
  const [bannerMessage, setBannerMessage] = useState("");
  const [locked, setLocked] = useState(false);
  const warningTimerRef = useRef(null);

  const showPopupWarning = (message) => {
    setWarningMessage(message);
    setShowWarning(true);
    clearTimeout(warningTimerRef.current);
    warningTimerRef.current = setTimeout(() => {
      setShowWarning(false);
    }, 2500);
  };

  const logViolation = useCallback(
    async (violationType) => {
      if (!userId || !testId || locked) return;

      const response = await fetch("/api/secure-exam/violations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testId, violationType }),
      });

      if (!response.ok) return;

      const data = await response.json();
      setViolationCount(data.violationCount);
      setMaxViolations(data.maxViolations);
      setBannerMessage(`${violationType.replace(/_/g, " ")} detected (${data.violationCount}/${data.maxViolations})`);
      showPopupWarning(WARNING_TEXT[violationType] || "Suspicious activity detected.");

      if (data.autoSubmitted) {
        onAutoSubmit?.();
      }

      if (data.locked) {
        setLocked(true);
        onLock?.();
      }
    },
    [locked, onAutoSubmit, onLock, testId, userId]
  );

  useEffect(() => {
    const startFullscreen = async () => {
      if (!document.fullscreenElement) {
        try {
          await document.documentElement.requestFullscreen();
        } catch (error) {
          setBannerMessage("Fullscreen permission is required for secure exam mode.");
          showPopupWarning("Please allow fullscreen to continue in secure mode.");
        }
      }
    };

    startFullscreen();

    const onVisibilityChange = () => {
      if (document.hidden) {
        logViolation(document.fullscreenElement ? "WINDOW_MINIMIZED" : "TAB_SWITCH");
      }
    };
    const onBlur = () => logViolation("WINDOW_FOCUS_LOST");
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        logViolation("FULLSCREEN_EXIT");
      }
    };
    const onBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";

      const payload = JSON.stringify({ testId, violationType: "PAGE_CLOSE_ATTEMPT" });
      navigator.sendBeacon("/api/secure-exam/violations/beacon", payload);
      return "";
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      clearTimeout(warningTimerRef.current);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [logViolation, testId]);

  useEffect(() => {
    let ws;
    let reconnectTimer;
    let cancelled = false;
    let attempts = 0;

    const connect = () => {
      if (cancelled) return;

      const protocol = window.location.protocol === "https:" ? "wss" : "ws";
      ws = new WebSocket(`${protocol}://${window.location.host}/ws/secure-exam?testId=${encodeURIComponent(testId)}`);

      ws.onopen = () => {
        attempts = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "VIOLATION_RECORDED" && data.payload?.userId === userId && data.payload?.testId === testId) {
            setViolationCount(data.payload.violationCount);
            setMaxViolations(data.payload.maxViolations);
            setBannerMessage(
              `${data.payload.violationType.replace(/_/g, " ")} detected (${data.payload.violationCount}/${data.payload.maxViolations})`
            );
          }
        } catch (error) {
          console.error("secure_exam_ws_parse_error", error);
        }
      };

      ws.onerror = (error) => {
        console.error("secure_exam_ws_error", error);
      };

      ws.onclose = () => {
        if (cancelled) return;
        attempts += 1;
        const delay = Math.min(10000, 500 * 2 ** attempts);
        reconnectTimer = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      cancelled = true;
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [testId, userId]);

  const remaining = useMemo(() => Math.max(0, maxViolations - violationCount), [maxViolations, violationCount]);

  return (
    <>
      {bannerMessage ? (
        <div
          style={{
            background: "#b91c1c",
            color: "white",
            padding: "10px 16px",
            borderRadius: 8,
            marginBottom: 12,
            fontWeight: 600,
          }}
        >
          ⚠ {bannerMessage}
        </div>
      ) : null}

      <div style={{ background: "#fff3cd", border: "1px solid #ffec99", borderRadius: 8, padding: 12, marginBottom: 12 }}>
        Violation count: <strong>{violationCount}</strong> / {maxViolations} (remaining: {remaining})
      </div>

      {showWarning ? (
        <div
          role="dialog"
          aria-live="assertive"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "grid",
            placeItems: "center",
            zIndex: 9999,
          }}
        >
          <div style={{ background: "white", borderRadius: 12, padding: 20, width: "min(400px, 90vw)" }}>
            <h3 style={{ marginTop: 0, color: "#b91c1c" }}>Violation Warning</h3>
            <p>{warningMessage}</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
