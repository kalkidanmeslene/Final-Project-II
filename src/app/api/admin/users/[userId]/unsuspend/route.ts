import type { NextRequest } from "next/server";
import { handleAdminUnsuspend } from "@/lib/auth/auth.controller";

export async function POST(req: NextRequest, ctx: { params: Promise<{ userId: string }> }) {
  const { userId } = await ctx.params;
  return handleAdminUnsuspend(req, userId);
}
