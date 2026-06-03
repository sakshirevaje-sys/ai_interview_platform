import { getDashboardStats } from "@/lib/secure-exam";
import { requireAdmin } from "@/lib/secure-exam-auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const access = await requireAdmin();
    if (!access.ok) {
      return Response.json({ error: access.error }, { status: access.status });
    }

    const dashboard = await getDashboardStats();
    return Response.json(dashboard);
  } catch (error) {
    console.error("secure_exam_dashboard_error", error);
    return Response.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
