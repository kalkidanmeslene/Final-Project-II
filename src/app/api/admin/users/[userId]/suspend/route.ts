import type { NextRequest } from "next/server";
import { handleAdminSuspendUser } from "@/lib/admin-dashboard/admin-dashboard.controller";

export async function POST(req: NextRequest, ctx: { params: Promise<{ userId: string }> }) {
  const { userId } = await ctx.params;
  return handleAdminSuspendUser(req, userId);
}
