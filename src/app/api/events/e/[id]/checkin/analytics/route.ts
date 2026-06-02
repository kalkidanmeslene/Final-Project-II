import type { NextRequest } from "next/server";
import { handleCheckinAnalytics } from "@/lib/checkin/checkin.controller";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return handleCheckinAnalytics(req, id);
}
