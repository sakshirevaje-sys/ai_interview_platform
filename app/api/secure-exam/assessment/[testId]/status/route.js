import { auth } from "@clerk/nextjs/server";
import { getAssessmentStatus } from "@/lib/secure-exam";

export const runtime = "nodejs";

export async function GET(request, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const status = await getAssessmentStatus({ userId, testId: params.testId });
    return Response.json(status);
  } catch (error) {
    console.error("secure_exam_status_error", error);
    return Response.json({ error: "Failed to fetch assessment status" }, { status: 500 });
  }
}
