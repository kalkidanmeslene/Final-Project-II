import { handleAiStatus } from "@/lib/ai/ai.controller";

export async function GET() {
  return handleAiStatus();
}
