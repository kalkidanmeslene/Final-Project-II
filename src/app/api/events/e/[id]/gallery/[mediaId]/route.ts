import type { NextRequest } from "next/server";
import { handleDeleteGallery } from "@/lib/events/event.controller";

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string; mediaId: string }> }) {
  const { id, mediaId } = await ctx.params;
  return handleDeleteGallery(req, id, mediaId);
}
