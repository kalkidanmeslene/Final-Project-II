import type { NextRequest } from "next/server";
import { handleScan } from "@/lib/checkin/checkin.controller";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return handleScan(req, id);
}
