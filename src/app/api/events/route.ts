import type { NextRequest } from "next/server";
import { handleCreateEvent, handleListPublicEvents } from "@/lib/events/event.controller";

export async function GET(req: NextRequest) {
  return handleListPublicEvents(req);
}

export async function POST(req: NextRequest) {
  return handleCreateEvent(req);
}
