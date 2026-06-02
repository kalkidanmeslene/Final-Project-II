import type { NextRequest } from "next/server";
import { handleBulkTransferTickets } from "@/lib/transfer/transfer.controller";

export async function POST(req: NextRequest) {
  return handleBulkTransferTickets(req);
}
