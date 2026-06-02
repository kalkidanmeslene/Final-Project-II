import type { NextRequest } from "next/server";
import { handleScanHistory } from "@/lib/checkin/checkin.controller";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return handleScanHistory(req, id);
}
