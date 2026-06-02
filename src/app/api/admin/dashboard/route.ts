import { handleAdminDashboard } from "@/lib/admin-dashboard/admin-dashboard.controller";

export async function GET() {
  return handleAdminDashboard();
}
