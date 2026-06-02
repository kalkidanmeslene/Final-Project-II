import type { NextRequest } from "next/server";
import { handleTrendingEvents } from "@/lib/discovery/discovery.controller";

export async function GET(req: NextRequest) {
  return handleTrendingEvents(req);
}
