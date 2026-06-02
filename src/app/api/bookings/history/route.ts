import { handleBookingHistory } from "@/lib/booking/booking.controller";

export async function GET() {
  return handleBookingHistory();
}
