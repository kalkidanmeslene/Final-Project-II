import type { NextRequest } from "next/server";
import { handleAdminTransferHistory } from "@/lib/transfer/transfer.controller";

export async function GET(req: NextRequest) {
  return handleAdminTransferHistory(req);
}
