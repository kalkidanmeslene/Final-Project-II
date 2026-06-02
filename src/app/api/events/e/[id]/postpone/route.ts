import type { NextRequest } from "next/server";
import { handlePostponeEvent } from "@/lib/events/event.controller";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return handlePostponeEvent(req, id);
}
