import { auth } from "@clerk/nextjs/server";
import { registerViolation } from "@/lib/secure-exam";
import { publishSecureExamEvent } from "@/lib/secure-exam-ws";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const raw = await request.text();
    const body = raw ? JSON.parse(raw) : {};
    const testId = String(body.testId || "").trim();

    if (!testId) {
      return Response.json({ error: "testId is required" }, { status: 400 });
    }

    const result = await registerViolation({
      userId,
      testId,
      violationType: "PAGE_CLOSE_ATTEMPT",
      metadata: { source: "sendBeacon" },
    });

    publishSecureExamEvent({
      type: "VIOLATION_RECORDED",
      payload: {
        userId,
        testId,
        violationType: result.violation.violationType,
        violationCount: result.session.violationCount,
        maxViolations: result.maxViolations,
        locked: result.session.locked,
        autoSubmitted: result.session.autoSubmitted,
        timestamp: result.violation.timestamp,
      },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("secure_exam_beacon_error", error);
    return Response.json({ error: "Failed to process beacon violation" }, { status: 500 });
  }
}
