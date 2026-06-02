import type { NextRequest } from "next/server";
import { handleTransferTicket, handleTicketTransferEligibility } from "@/lib/transfer/transfer.controller";

export async function GET(req: NextRequest, ctx: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await ctx.params;
  return handleTicketTransferEligibility(req, ticketId);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await ctx.params;
  return handleTransferTicket(req, ticketId);
}
