import { auth, clerkClient } from "@clerk/nextjs/server";

export async function requireAdmin() {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const claimRole = String(sessionClaims?.metadata?.role || sessionClaims?.public_metadata?.role || "").toLowerCase();
  if (claimRole === "admin") {
    return { ok: true, userId };
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const role = String(user.publicMetadata?.role || user.privateMetadata?.role || claimRole).toLowerCase();

  if (role !== "admin") {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  return { ok: true, userId };
}
