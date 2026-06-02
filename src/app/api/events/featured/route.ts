import type { NextRequest } from "next/server";
import { handleFeaturedEvents } from "@/lib/discovery/discovery.controller";

export async function GET(req: NextRequest) {
  return handleFeaturedEvents(req);
}
