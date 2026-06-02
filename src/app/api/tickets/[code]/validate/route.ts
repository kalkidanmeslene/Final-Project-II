import type { NextRequest } from "next/server";
import { handleValidateTicket } from "@/lib/booking/booking.controller";

export async function GET(req: NextRequest, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  return handleValidateTicket(req, code);
}
