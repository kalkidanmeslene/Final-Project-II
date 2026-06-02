import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { buildOrganizerDashboard } from "@/lib/organizer-dashboard/organizer-dashboard.service";
import { buildReportsDashboard } from "@/lib/reports/reports.service";
import { OrganizerDashboardLayout } from "@/components/organizer-dashboard/organizer-dashboard-layout";
import { OrganizerDashboardClient } from "@/components/organizer-dashboard/organizer-dashboard-client";

export default async function OrganizerDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "organizer" && user.role !== "admin") redirect("/dashboard/attendee");

  const [initial, reportsInitial] = await Promise.all([
    buildOrganizerDashboard(user.id),
    buildReportsDashboard("organizer", user.id, { days: 30 }),
  ]);

  return (
    <OrganizerDashboardLayout>
      <OrganizerDashboardClient initial={initial} reportsInitial={reportsInitial} />
    </OrganizerDashboardLayout>
  );
}
