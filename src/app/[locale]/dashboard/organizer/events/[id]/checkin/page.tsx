import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { canAccessEventCheckin } from "@/lib/checkin/checkin.access";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { EventCheckinDashboard } from "@/components/checkin/event-checkin-dashboard";

export default async function EventCheckinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "organizer" && user.role !== "admin") redirect("/dashboard/attendee");

  const event = await prisma.event.findUnique({
    where: { id },
    select: { id: true, title: true, organizerId: true },
  });
  if (!event) redirect("/dashboard/organizer/events");

  const allowed = await canAccessEventCheckin(event.id, user.id, user.role);
  if (!allowed) redirect("/dashboard/organizer/events");

  const canManageStaff = user.role === "admin" || event.organizerId === user.id;

  return (
    <DashboardShell hideTitle>
      <div className="mx-auto max-w-4xl">
        <Link
          href="/dashboard/organizer"
          className="mb-6 inline-flex items-center gap-2 text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <EventCheckinDashboard
          eventId={event.id}
          eventTitle={event.title}
          canManageStaff={canManageStaff}
        />
      </div>
    </DashboardShell>
  );
}
