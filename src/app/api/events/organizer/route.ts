import { handleOrganizerEvents } from "@/lib/events/event.controller";

export async function GET() {
  return handleOrganizerEvents();
}
