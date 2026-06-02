import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { EventForm } from "@/components/events/event-form";

export default async function NewEventPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "organizer" && user.role !== "admin") redirect("/dashboard/attendee");

  return (
    <DashboardShell hideTitle>
      <div className="mx-auto max-w-4xl">
        <EventForm mode="create" showHeader />
      </div>
    </DashboardShell>
  );
}
