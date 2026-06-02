import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Calendar, Ticket, History, Sparkles } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";

export default async function AttendeeDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const quickLinks = [
    {
      href: "/events",
      label: "Browse events",
      description: "Discover and book upcoming events",
      icon: Calendar,
      primary: true,
    },
    {
      href: "/dashboard/attendee/tickets",
      label: "My tickets",
      description: "View QR tickets for your bookings",
      icon: Ticket,
    },
    {
      href: "/dashboard/attendee/bookings",
      label: "Booking history",
      description: "Past bookings and payment status",
      icon: History,
    },
    {
      href: "/profile/attendee",
      label: "My profile",
      description: "Tickets, favorites, and account settings",
      icon: Sparkles,
    },
  ];

  return (
    <DashboardShell title="Hibir Events">
      <div className="space-y-8">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-foreground">Welcome, {user.fullName}</h2>
          <p className="mt-2 text-muted-foreground">Browse events, manage tickets, and track your bookings.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/events">
              <Button size="lg">Browse events</Button>
            </Link>
            <Link href="/notifications">
              <Button variant="outline" size="lg">
                Notifications
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {quickLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md"
              >
                <div className="mb-4 inline-flex rounded-lg bg-secondary p-3 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-foreground">{item.label}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
              </Link>
            );
          })}
        </div>

        {user.role === "attendee" && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-6">
            <h3 className="font-semibold text-foreground">Want to host events?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Apply to become an organizer and create your own events on Hibir.
            </p>
            <Link href="/become-organizer" className="mt-4 inline-block">
              <Button variant="outline">Become organizer</Button>
            </Link>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
