import { handleMyTickets } from "@/lib/booking/booking.controller";

export async function GET() {
  return handleMyTickets();
}
