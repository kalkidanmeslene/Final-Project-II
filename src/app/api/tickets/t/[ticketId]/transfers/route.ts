import type { NextRequest } from "next/server";
import { handleTicketTransferHistory } from "@/lib/transfer/transfer.controller";

export async function GET(req: NextRequest, ctx: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await ctx.params;
  return handleTicketTransferHistory(req, ticketId);
}
