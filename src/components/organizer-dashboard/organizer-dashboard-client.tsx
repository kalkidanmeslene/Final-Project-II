"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  Calendar,
  DollarSign,
  Star,
  Ticket,
  UserCheck,
  ArrowLeftRight,
  Eye,
  QrCode,
  TrendingUp,
} from "lucide-react";
import type { OrganizerDashboardData } from "@/lib/organizer-dashboard/organizer-dashboard.types";
import type { ReportsDashboardData } from "@/lib/reports/reports.types";
import { ReportsHub } from "@/components/reports/reports-hub";
import { useOrganizerDashboard, useEventAttendees } from "@/hooks/use-organizer-dashboard";
import { OrganizerAnnouncementForm } from "@/components/notifications/organizer-announcement-form";
import { DashboardStatCard } from "./dashboard-stat-card";
import { DashboardSection } from "./organizer-dashboard-layout";
import { CheckinPieChart, PerformanceChart, RevenueByEventChart, RevenueSimulationChart, SalesTrendChart } from "./dashboard-charts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { StarRating } from "@/components/reviews/star-rating";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

function statusBadge(status: string) {
  switch (status) {
    case "approved":
      return <Badge variant="success">Published</Badge>;
    case "pending":
      return <Badge variant="info">Pending</Badge>;
    case "cancelled":
      return <Badge variant="danger">Cancelled</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

export function OrganizerDashboardClient({
  initial,
  reportsInitial,
}: {
  initial: OrganizerDashboardData;
  reportsInitial?: ReportsDashboardData;
}) {
  const { data, isLoading } = useOrganizerDashboard(initial);
  const dashboard = data ?? initial;
  const [selectedEventId, setSelectedEventId] = useState<string | null>(
    dashboard.events[0]?.id ?? null,
  );
  const [notifEventId, setNotifEventId] = useState<string | null>(
    dashboard.events.find((e) => e.status === "approved")?.id ?? null,
  );

  const { data: attendeesData, isLoading: attendeesLoading } = useEventAttendees(selectedEventId);

  if (isLoading && !dashboard) {
    return <Spinner label="Loading dashboard" />;
  }

  const d = dashboard;
  const notifEvent = d.events.find((e) => e.id === notifEventId);

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h1 className="text-2xl font-bold sm:text-3xl">Organizer Dashboard</h1>
        <p className="text-muted-foreground">Analytics, events, and attendee tools in one place</p>
      </div>

      <DashboardSection id="overview" title="Overview analytics" description="Key metrics across all your events.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard label="Total events" value={String(d.overview.totalEvents)} icon={Calendar} hint={`${d.overview.publishedEvents} published`} />
          <DashboardStatCard label="Tickets sold" value={d.overview.ticketsSold.toLocaleString()} icon={Ticket} hint={`of ${d.overview.totalCapacity} capacity`} />
          <DashboardStatCard label="Revenue" value={formatCurrency(d.overview.revenue)} icon={DollarSign} hint="Simulated from sales" />
          <DashboardStatCard label="Check-ins" value={d.overview.checkIns.toLocaleString()} icon={UserCheck} hint={`${d.overview.totalTransfers} transfers`} />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DashboardStatCard
            label="Average rating"
            value={d.overview.averageRating != null ? d.overview.averageRating.toFixed(1) : "—"}
            icon={Star}
            hint={`${d.pendingReviewsCount} reviews pending`}
          />
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="mb-3 text-sm font-medium text-muted-foreground">Sales trend (30 days)</p>
            <SalesTrendChart data={d.salesByDay} />
          </div>
        </div>
      </DashboardSection>

      <DashboardSection id="events" title="Event management" description="Create, edit, and monitor your events.">
        <div className="mb-4 flex flex-wrap gap-2">
          <Link href="/dashboard/organizer/events/new">
            <Button>Create event</Button>
          </Link>
          <Link href="/dashboard/organizer/events">
            <Button variant="outline">All events</Button>
          </Link>
        </div>
        <div className="space-y-3">
          {d.events.length === 0 && (
            <p className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
              No events yet. Create your first event to get started.
            </p>
          )}
          {d.events.slice(0, 8).map((event) => (
            <div
              key={event.id}
              className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center"
            >
              <div className="relative h-20 w-full shrink-0 overflow-hidden rounded-lg sm:h-16 sm:w-24">
                {event.bannerUrl ? (
                  <Image src={event.bannerUrl} alt="" fill className="object-cover" sizes="96px" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-secondary text-xs text-muted-foreground">No image</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{event.title}</h3>
                  {statusBadge(event.status)}
                </div>
                <p className="text-sm text-muted-foreground">{formatDate(event.startsAt)}</p>
                <p className="text-sm">
                  {event.sold}/{event.capacity} sold · {formatCurrency(event.revenue)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/dashboard/organizer/events/${event.id}/edit`}>
                  <Button variant="outline" size="sm">
                    <Eye className="mr-1 h-4 w-4" />
                    Edit
                  </Button>
                </Link>
                <Link href={`/dashboard/organizer/events/${event.id}/checkin`}>
                  <Button variant="outline" size="sm">
                    <QrCode className="mr-1 h-4 w-4" />
                    Scan
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </DashboardSection>

      <DashboardSection id="sales" title="Ticket sales analytics" description="Revenue and volume over the last 30 days.">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="mb-4 font-medium">Daily sales</p>
            <SalesTrendChart data={d.salesByDay} />
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="mb-4 font-medium">Revenue by event</p>
            <RevenueByEventChart data={d.revenueByEvent} />
          </div>
        </div>
      </DashboardSection>

      <DashboardSection id="attendees" title="Attendee lists" description="Confirmed ticket holders per event.">
        <div className="mb-4">
          <label htmlFor="attendee-event" className="mb-2 block text-sm font-medium">
            Select event
          </label>
          <select
            id="attendee-event"
            value={selectedEventId ?? ""}
            onChange={(e) => setSelectedEventId(e.target.value || null)}
            className="w-full max-w-md rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            {d.events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>
        </div>
        {attendeesLoading ? (
          <Spinner label="Loading attendees" />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border bg-secondary/50">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Ticket</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Check-in</th>
                </tr>
              </thead>
              <tbody>
                {(attendeesData?.attendees ?? []).map((a) => (
                  <tr key={a.ticketId} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium">{a.holderName}</p>
                      <p className="text-xs text-muted-foreground">{a.email ?? a.phone ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{a.ticketCode}</td>
                    <td className="px-4 py-3">{a.ticketType}</td>
                    <td className="px-4 py-3">
                      {a.checkedIn ? (
                        <Badge variant="success">Checked in</Badge>
                      ) : (
                        <Badge variant="default">Not yet</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(attendeesData?.attendees ?? []).length === 0 && (
              <p className="p-8 text-center text-muted-foreground">No confirmed attendees for this event.</p>
            )}
          </div>
        )}
      </DashboardSection>

      <DashboardSection id="checkin" title="QR validation dashboard" description="Check-in progress and scan results.">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="mb-4 font-medium">Check-in progress</p>
            <CheckinPieChart checkedIn={d.checkinSummary.checkedIn} remaining={d.checkinSummary.remaining} />
            <p className="mt-2 text-center text-sm text-muted-foreground">
              {d.checkinSummary.checkedIn} of {d.checkinSummary.totalTickets} tickets checked in
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="mb-4 font-medium">Scan results (all events)</p>
            <ul className="space-y-2 text-sm">
              {(
                [
                  ["valid", "Valid", "text-success"],
                  ["already_used", "Already used", "text-amber-600"],
                  ["expired", "Expired", "text-muted-foreground"],
                  ["invalid", "Invalid", "text-destructive"],
                ] as const
              ).map(([key, label, color]) => (
                <li key={key} className="flex justify-between border-b border-border py-2 last:border-0">
                  <span>{label}</span>
                  <span className={cn("font-semibold", color)}>{d.checkinSummary.scanCounts[key]}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-2">
              {d.events
                .filter((e) => e.status === "approved")
                .slice(0, 3)
                .map((e) => (
                  <Link key={e.id} href={`/dashboard/organizer/events/${e.id}/checkin`}>
                    <Button variant="outline" size="sm">
                      <QrCode className="mr-1 h-4 w-4" />
                      {e.title.slice(0, 20)}
                    </Button>
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </DashboardSection>

      <DashboardSection id="notifications" title="Notifications management" description="Send announcements to ticket holders.">
        <div className="mb-4 max-w-md">
          <label htmlFor="notif-event" className="mb-2 block text-sm font-medium">
            Event for announcement
          </label>
          <select
            id="notif-event"
            value={notifEventId ?? ""}
            onChange={(e) => setNotifEventId(e.target.value || null)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            {d.events
              .filter((e) => e.status === "approved")
              .map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
          </select>
        </div>
        {notifEvent ? (
          <OrganizerAnnouncementForm eventId={notifEvent.id} eventTitle={notifEvent.title} />
        ) : (
          <p className="text-sm text-muted-foreground">Publish an event to send announcements.</p>
        )}
        <p className="mt-4 text-sm text-muted-foreground">
          <Link href="/notifications" className="text-primary hover:underline">
            View your notification inbox
          </Link>
          {" · "}
          <Link href="/profile/notifications" className="text-primary hover:underline">
            Notification preferences
          </Link>
        </p>
      </DashboardSection>

      <DashboardSection id="revenue" title="Revenue simulation" description="Actual sales vs projected full sell-out.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <DashboardStatCard label="Actual revenue" value={formatCurrency(d.revenueSimulation.actualRevenue)} icon={DollarSign} />
          <DashboardStatCard label="Projected (sell-out)" value={formatCurrency(d.revenueSimulation.projectedRevenue)} icon={TrendingUp} />
          <DashboardStatCard label="Sell-through" value={`${d.revenueSimulation.sellThroughRate}%`} icon={Ticket} hint={`${d.revenueSimulation.remainingCapacity} seats left`} />
        </div>
        <div className="mt-6 rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="mb-4 font-medium">Actual vs projected</p>
          <RevenueSimulationChart actual={d.revenueSimulation.actualRevenue} projected={d.revenueSimulation.projectedRevenue} />
          <p className="mt-2 text-xs text-muted-foreground">
            Projection assumes remaining capacity sells at your current average ticket price. For planning only — not a guarantee.
          </p>
        </div>
      </DashboardSection>

      <DashboardSection id="performance" title="Event performance charts" description="Compare sales and check-ins per event.">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <PerformanceChart data={d.performance} />
        </div>
        <div className="mt-4 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border bg-secondary/50">
              <tr>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Sold</th>
                <th className="px-4 py-3">Check-ins</th>
                <th className="px-4 py-3">Revenue</th>
                <th className="px-4 py-3">Rating</th>
              </tr>
            </thead>
            <tbody>
              {d.performance.map((row) => (
                <tr key={row.id} className="border-b border-border">
                  <td className="px-4 py-3 font-medium">{row.title}</td>
                  <td className="px-4 py-3">
                    {row.sold}/{row.capacity}
                  </td>
                  <td className="px-4 py-3">{row.checkedIn}</td>
                  <td className="px-4 py-3">{formatCurrency(row.revenue)}</td>
                  <td className="px-4 py-3">
                    {row.averageRating != null ? (
                      <div className="flex items-center gap-2">
                        <StarRating value={Math.round(row.averageRating)} readOnly size="sm" />
                        <span className="text-xs text-muted-foreground">({row.reviewCount})</span>
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardSection>

      <DashboardSection id="transfers" title="Transfer monitoring" description="Recent ticket transfers across your events.">
        {d.transfers.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
            No ticket transfers yet.
          </p>
        ) : (
          <div className="space-y-3">
            {d.transfers.map((t) => (
              <div key={t.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card p-4">
                <div>
                  <p className="font-medium">{t.eventTitle}</p>
                  <p className="text-sm text-muted-foreground">
                    {t.fromName} → {t.toName} · <span className="font-mono">{t.ticketCode}</span>
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">{formatDate(t.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </DashboardSection>

      <DashboardSection id="feedback" title="Feedback management" description="Attendee reviews and ratings.">
        {d.pendingReviewsCount > 0 && (
          <p className="mb-4 rounded-lg bg-primary/10 px-4 py-2 text-sm text-primary">
            {d.pendingReviewsCount} review(s) awaiting admin moderation before they affect public ratings.
          </p>
        )}
        {d.feedback.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
            No reviews yet. Reviews appear after verified check-in and event end.
          </p>
        ) : (
          <div className="space-y-4">
            {d.feedback.map((r) => (
              <div key={r.id} className="rounded-xl border border-border bg-card p-5">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{r.eventTitle}</p>
                    <p className="text-sm text-muted-foreground">{r.authorName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StarRating value={r.rating} readOnly size="sm" />
                    <Badge variant={r.status === "approved" ? "success" : "info"}>{r.status}</Badge>
                  </div>
                </div>
                <p className="text-sm leading-relaxed">{r.comment}</p>
              </div>
            ))}
          </div>
        )}
        {d.events.some((e) => e.status === "approved") && (
          <Link
            href={`/dashboard/organizer/events/${d.events.find((e) => e.status === "approved")!.id}/edit`}
            className="mt-4 inline-block text-sm text-primary hover:underline"
          >
            Open event editor for detailed review analytics →
          </Link>
        )}
      </DashboardSection>

      <DashboardSection
        id="reports"
        title="Reports & exports"
        description="Sales, attendance, validation scans, transfers, and revenue projections."
      >
        <ReportsHub scope="organizer" initial={reportsInitial} />
      </DashboardSection>
    </div>
  );
}
