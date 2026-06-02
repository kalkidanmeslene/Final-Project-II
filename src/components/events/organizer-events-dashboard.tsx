"use client";

import Link from "next/link";
import { useOrganizerEvents, useEventMutations } from "@/hooks/use-events";
import { EventCard } from "./event-card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Alert } from "@/components/ui/alert";

export function OrganizerEventsDashboard() {
  const { data, isLoading, isError } = useOrganizerEvents();
  const { deleteEvent } = useEventMutations();

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? Only allowed when no tickets are sold.`)) return;
    try {
      await deleteEvent.mutateAsync(id);
    } catch {
      alert("Cannot delete: tickets may have been sold or event not found.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">Create, edit, and manage your events.</p>
        <Link href="/dashboard/organizer/events/new">
          <Button>Create event</Button>
        </Link>
      </div>

      {isLoading && <Spinner label="Loading events" />}
      {isError && (
        <Alert variant="destructive" role="alert">
          Failed to load events.
        </Alert>
      )}

      {data?.events.length === 0 && !isLoading && (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No events yet.</p>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {data?.events.map((event) => (
          <div key={event.id} className="space-y-2">
            <EventCard event={event} />
            <div className="flex flex-wrap gap-2">
              <Link href={`/dashboard/organizer/events/${event.id}/edit`}>
                <Button variant="outline" className="h-8 px-3 text-xs">
                  Edit
                </Button>
              </Link>
              <Link href={`/dashboard/organizer/events/${event.id}/checkin`}>
                <Button variant="outline" className="h-8 px-3 text-xs">
                  Check-in
                </Button>
              </Link>
              <Link href={`/events/${event.slug}`}>
                <Button variant="ghost" className="h-8 px-3 text-xs">
                  View
                </Button>
              </Link>
              {event.availability.sold === 0 && (
                <Button
                  variant="ghost"
                  className="h-8 px-3 text-xs text-red-600"
                  onClick={() => handleDelete(event.id, event.title)}
                  disabled={deleteEvent.isPending}
                >
                  Delete
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
