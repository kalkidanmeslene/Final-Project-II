import { handleOrganizerDashboard } from "@/lib/organizer-dashboard/organizer-dashboard.controller";

export async function GET() {
  return handleOrganizerDashboard();
}
