import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { OrganizerEventsDashboard } from "@/components/events/organizer-events-dashboard";

export default async function OrganizerEventsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "organizer" && user.role !== "admin") redirect("/dashboard/attendee");

  return (
    <DashboardShell title="My events">
      <OrganizerEventsDashboard />
    </DashboardShell>
  );
}
