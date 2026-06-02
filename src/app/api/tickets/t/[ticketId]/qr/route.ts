import type { NextRequest } from "next/server";
import { handleTicketQr } from "@/lib/checkin/checkin.controller";

export async function GET(req: NextRequest, ctx: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await ctx.params;
  return handleTicketQr(req, ticketId);
}
