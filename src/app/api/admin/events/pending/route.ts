import { handleAdminPending } from "@/lib/events/event.controller";

export async function GET() {
  return handleAdminPending();
}
