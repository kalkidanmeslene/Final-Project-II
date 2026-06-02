import type { NextRequest } from "next/server";
import { handleRefresh } from "@/lib/auth/auth.controller";

export async function POST(req: NextRequest) {
  return handleRefresh(req);
}
