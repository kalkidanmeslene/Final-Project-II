import type { NextRequest } from "next/server";
import { handleGetAvailability } from "@/lib/events/event.controller";

export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  return handleGetAvailability(req, slug);
}
