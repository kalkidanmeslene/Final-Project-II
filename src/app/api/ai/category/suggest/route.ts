import type { NextRequest } from "next/server";
import { handleCategorySuggest } from "@/lib/ai/ai.controller";

export async function POST(req: NextRequest) {
  return handleCategorySuggest(req);
}
