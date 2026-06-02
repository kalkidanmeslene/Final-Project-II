import type { NextRequest } from "next/server";
import { handleBookingDetail } from "@/lib/booking/booking.controller";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return handleBookingDetail(req, id);
}
