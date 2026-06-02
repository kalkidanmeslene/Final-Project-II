"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Plus, TrendingUp, Users, DollarSign, Calendar, Eye, QrCode } from "lucide-react";
import type { EventStatus } from "@prisma/client";
import { useOrganizerEvents } from "@/hooks/use-events";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Alert } from "@/components/ui/alert";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type EventFilter = "all" | "published" | "draft";

function statusBadge(status: EventStatus) {
  switch (status) {
    case "approved":
      return <Badge variant="success">Published</Badge>;
    case "draft":
      return <Badge variant="default">Draft</Badge>;
    case "pending":
      return <Badge variant="info">Pending</Badge>;
    case "cancelled":
      return <Badge variant="danger">Cancelled</Badge>;
    case "completed":
      return <Badge variant="default">Completed</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

export function OrganizerDashboardView() {
  const { data, isLoading, isError } = useOrganizerEvents();
  const [filter, setFilter] = useState<EventFilter>("all");
  const events = data?.events ?? [];

  const filteredEvents = events.filter((event) => {
    if (filter === "published") return event.status === "approved";
    if (filter === "draft") return event.status === "draft";
    return true;
  });

  const totalSold = events.reduce((sum, e) => sum + e.availability.sold, 0);
  const totalRevenue = events.reduce(
    (sum, e) => sum + e.availability.sold * e.ticketPrice,
    0,
  );
  const capacityTotal = events.reduce((sum, e) => sum + e.capacity, 0);
  const avgAttendance =
    capacityTotal > 0 ? Math.round((totalSold / capacityTotal) * 100) : 0;

  const stats = [
    {
      label: "Total Events",
      value: String(events.length),
      icon: Calendar,
      trend: events.length > 0 ? `${events.length} active` : "Create your first event",
      color: "text-primary",
    },
    {
      label: "Total Tickets Sold",
      value: totalSold.toLocaleString(),
      icon: Users,
      trend: totalSold > 0 ? "Across all events" : "No sales yet",
      color: "text-success",
    },
    {
      label: "Total Revenue",
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      trend: totalRevenue > 0 ? "From ticket sales" : "No revenue yet",
      color: "text-accent",
    },
    {
      label: "Avg. Attendance",
      value: `${avgAttendance}%`,
      icon: TrendingUp,
      trend: capacityTotal > 0 ? "Sold vs capacity" : "No capacity set",
      color: "text-primary",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Organizer Dashboard</h2>
          <p className="mt-1 text-muted-foreground">Manage your events and track performance</p>
        </div>
        <Link href="/dashboard/organizer/events/new">
          <Button size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Create Event
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-xl border border-border bg-card p-6 shadow-sm"
            >
              <div className={`mb-4 inline-flex rounded-lg bg-secondary p-3 ${stat.color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <p className="mb-1 text-sm text-muted-foreground">{stat.label}</p>
              <p className="mb-2 text-3xl font-bold">{stat.value}</p>
              <p className="text-xs text-success">{stat.trend}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h3 className="text-2xl font-bold">My Events</h3>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["all", "All Events"],
                ["published", "Published"],
                ["draft", "Draft"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={cn(
                  "rounded-lg px-4 py-2 font-medium transition-colors",
                  filter === value
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {isLoading && <Spinner label="Loading events" />}
        {isError && (
          <Alert variant="destructive" role="alert">
            Failed to load events.
          </Alert>
        )}

        {!isLoading && filteredEvents.length === 0 && events.length > 0 && (
          <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No events match this filter.
          </p>
        )}

        {!isLoading && events.length === 0 && (
          <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No events yet. Create your first event to get started.
          </p>
        )}

        <div className="space-y-4">
          {filteredEvents.slice(0, 6).map((event) => (
            <div
              key={event.id}
              className="flex flex-col gap-4 rounded-lg border border-border bg-background p-4 transition-all hover:shadow-md md:flex-row"
            >
              <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-lg md:w-32">
                {event.bannerUrl ? (
                  <Image
                    src={event.bannerUrl}
                    alt={event.title}
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-secondary text-sm text-muted-foreground">
                    No image
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-lg font-semibold">{event.title}</h4>
                    <p className="text-sm text-muted-foreground">{formatDate(event.startsAt)}</p>
                  </div>
                  {statusBadge(event.status)}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Tickets Sold</p>
                    <p className="font-semibold">
                      {event.availability.sold} / {event.capacity}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                    <p className="font-semibold">
                      {formatCurrency(event.availability.sold * event.ticketPrice)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Available</p>
                    <p className="font-semibold">{event.availability.available}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="font-semibold capitalize text-success">{event.status}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 md:flex-col md:justify-end">
                <Link href={`/dashboard/organizer/events/${event.id}/edit`}>
                  <Button variant="outline" size="sm">
                    <Eye className="mr-1 h-4 w-4" />
                    Analytics
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
      </div>
    </div>
  );
}