import type { NextRequest } from "next/server";
import { handleDeleteEvent, handleUpdateEvent } from "@/lib/events/event.controller";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return handleUpdateEvent(req, id);
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return handleDeleteEvent(_req, id);
}
