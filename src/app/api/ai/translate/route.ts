import type { NextRequest } from "next/server";
import { handleTranslate } from "@/lib/ai/ai.controller";

export async function POST(req: NextRequest) {
  return handleTranslate(req);
}
