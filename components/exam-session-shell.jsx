"use client";

import { useEffect, useState } from "react";
import SecureExamMonitor from "@/components/secure-exam-monitor";

export default function ExamSessionShell({ testId }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [userId, setUserId] = useState(null);
  const [locked, setLocked] = useState(false);
  const [autoSubmitted, setAutoSubmitted] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const meResponse = await fetch("/api/secure-exam/me");
      if (!meResponse.ok || !active) {
        setIsLoaded(true);
        return;
      }

      const me = await meResponse.json();
      if (!active) return;

      setUserId(me.userId || null);
      if (me.userId) {
        const response = await fetch(`/api/secure-exam/assessment/${encodeURIComponent(testId)}/status`);
        if (response.ok) {
          const data = await response.json();
          if (!active) return;
          setLocked(Boolean(data.locked));
          setAutoSubmitted(Boolean(data.autoSubmitted));
        }
      }

      setIsLoaded(true);
    };

    load();
    return () => {
      active = false;
    };
  }, [testId]);

  if (!isLoaded) {
    return <p>Loading secure exam mode…</p>;
  }

  if (!userId) {
    return <p>Please sign in to start the assessment.</p>;
  }

  return (
    <main style={{ maxWidth: 900, margin: "24px auto", padding: 20 }}>
      <h1>Assessment: {testId}</h1>

      <SecureExamMonitor
        userId={userId}
        testId={testId}
        onAutoSubmit={() => setAutoSubmitted(true)}
        onLock={() => setLocked(true)}
      />

      <section style={{ background: "white", borderRadius: 8, padding: 20 }}>
        {locked ? (
          <p style={{ color: "#b91c1c", fontWeight: 700 }}>Assessment locked due to repeated secure exam violations.</p>
        ) : (
          <p>Exam content area. Candidate can continue only while secure exam mode stays compliant.</p>
        )}

        {autoSubmitted ? <p style={{ color: "#b45309" }}>Your test has been auto-submitted.</p> : null}
      </section>
    </main>
  );
}
