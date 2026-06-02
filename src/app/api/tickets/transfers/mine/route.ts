import { handleMyTransferHistory } from "@/lib/transfer/transfer.controller";

export async function GET() {
  return handleMyTransferHistory();
}
