import type { NextRequest } from "next/server";
import { handleUploadGallery } from "@/lib/events/event.controller";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return handleUploadGallery(req, id);
}
