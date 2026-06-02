import type { NextRequest } from "next/server";
import { handleGetTicketTypes } from "@/lib/booking/booking.controller";

export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  return handleGetTicketTypes(req, slug);
}
