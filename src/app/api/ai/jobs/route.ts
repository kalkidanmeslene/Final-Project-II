import type { NextRequest } from "next/server";
import { handleCreateAiJob } from "@/lib/ai/ai.controller";

export async function POST(req: NextRequest) {
  return handleCreateAiJob(req);
}
