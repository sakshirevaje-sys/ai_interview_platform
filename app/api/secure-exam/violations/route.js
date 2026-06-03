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

    const body = await request.json();
    const testId = String(body.testId || "").trim();
    const violationType = String(body.violationType || "").trim();

    if (!testId || !violationType) {
      return Response.json({ error: "testId and violationType are required" }, { status: 400 });
    }

    const result = await registerViolation({
      userId,
      testId,
      violationType,
      metadata: body.metadata,
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

    return Response.json({
      success: true,
      violationCount: result.session.violationCount,
      maxViolations: result.maxViolations,
      locked: result.session.locked,
      autoSubmitted: result.session.autoSubmitted,
      report: result.report,
    });
  } catch (error) {
    console.error("secure_exam_violation_error", error);
    return Response.json({ error: "Failed to register violation" }, { status: 500 });
  }
}
