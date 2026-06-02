"use client";

import Link from "next/link";
import { useAdminPendingEvents, useEventMutations } from "@/hooks/use-events";
import { formatEventDate, formatPrice } from "@/lib/events/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Alert } from "@/components/ui/alert";

export function EventModerationQueue() {
  const { data, isLoading, isError, refetch } = useAdminPendingEvents();
  const { approveEvent, rejectEvent } = useEventMutations();

  async function approve(id: string) {
    await approveEvent.mutateAsync({ id });
    void refetch();
  }

  async function reject(id: string) {
    const note = prompt("Rejection note (optional):") ?? undefined;
    await rejectEvent.mutateAsync({ id, note });
    void refetch();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending events</CardTitle>
        <CardDescription>Review and approve or reject organizer submissions.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && <Spinner />}
        {isError && <Alert variant="destructive">Failed to load pending events.</Alert>}
        {!isLoading && data?.events.length === 0 && <p className="text-sm text-zinc-500">No pending events.</p>}
        {data?.events.map((e) => (
          <div key={e.id} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="font-medium">{e.title}</p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {e.organizer.fullName} · {formatEventDate(e.startsAt)} · {formatPrice(e.ticketPrice)}
            </p>
            <p className="text-sm">
              {e.venue}, {e.location}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href={`/events/${e.slug}`}>
                <Button variant="outline" className="h-8 px-3 text-xs">
                  Preview
                </Button>
              </Link>
              <Button className="h-8 px-3 text-xs" onClick={() => approve(e.id)} disabled={approveEvent.isPending}>
                Approve
              </Button>
              <Button className="h-8 px-3 text-xs" variant="outline" onClick={() => reject(e.id)} disabled={rejectEvent.isPending}>
                Reject
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
