import type { NextRequest } from "next/server";
import { handleGetAiJob } from "@/lib/ai/ai.controller";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return handleGetAiJob(_req, id);
}
