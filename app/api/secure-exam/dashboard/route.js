import { auth } from "@clerk/nextjs/server";
import { getDashboardStats } from "@/lib/secure-exam";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dashboard = await getDashboardStats();
    return Response.json(dashboard);
  } catch (error) {
    return Response.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
