import type { NextRequest } from "next/server";
import { handleAdminApprove } from "@/lib/events/event.controller";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return handleAdminApprove(req, id);
}
