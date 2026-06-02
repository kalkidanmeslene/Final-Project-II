import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { buildAdminDashboard } from "@/lib/admin-dashboard/admin-dashboard.service";
import { buildReportsDashboard } from "@/lib/reports/reports.service";
import { AdminDashboardClient } from "@/components/admin-dashboard/admin-dashboard-client";

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/dashboard/attendee");

  const [initial, reportsInitial] = await Promise.all([
    buildAdminDashboard(),
    buildReportsDashboard("admin", undefined, { days: 30 }),
  ]);

  return <AdminDashboardClient initial={initial} reportsInitial={reportsInitial} />;
}
