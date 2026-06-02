"use client";

import { Suspense, useState } from "react";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { CheckCircle2 } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { EventForm } from "@/components/events/event-form";
import { EditEventNotice } from "@/components/events/edit-event-notice";
import { EventMediaUpload } from "@/components/events/event-media-upload";
import { Alert } from "@/components/ui/alert";
import { PostponeEventForm } from "@/components/events/postpone-event-form";
import { eventsKeys, useEventMutations } from "@/hooks/use-events";
import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api/fetch-json";
import type { EventDetail } from "@/lib/events/event.types";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { EventStatusBadge } from "@/components/events/event-status-badge";
import { CancelEventDialog } from "@/components/events/cancel-event-dialog";
import { OrganizerAnnouncementForm } from "@/components/notifications/organizer-announcement-form";
import { OrganizerReviewsPanel } from "@/components/reviews/organizer-reviews-panel";

export default function EditEventPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const { submitEvent, cancelEvent } = useEventMutations();
  const [submitNotice, setSubmitNotice] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: eventsKeys.byId(id),
    queryFn: async () => {
      const org = await fetchJson<{ events: EventDetail[] }>("/api/events/organizer");
      const found = org.events.find((e) => e.id === id);
      if (!found) throw new Error("Not found");
      const detail = await fetchJson<{ event: EventDetail }>(`/api/events/s/${found.slug}`);
      return detail.event;
    },
    enabled: !!id,
  });

  if (isLoading || !data) {
    return (
      <DashboardShell title="Edit event">
        <Spinner />
      </DashboardShell>
    );
  }

  const event = data;

  async function onSubmitForApproval() {
    setSubmitNotice(null);
    try {
      await submitEvent.mutateAsync(event.id);
      setSubmitNotice("Event submitted for approval. An admin will review it soon.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setSubmitNotice(null);
    }
  }

  return (
    <DashboardShell title="Edit event">
      <Suspense fallback={null}>
        <EditEventNotice />
      </Suspense>

      {submitNotice && (
        <Alert variant="success" role="status" className="mb-6 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {submitNotice}
        </Alert>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <EventStatusBadge status={event.status} />
        <Link href={`/events/${event.slug}`}>
          <Button variant="outline" className="h-8 px-3 text-xs">
            Public page
          </Button>
        </Link>
        {event.status === "draft" && (
          <Button className="h-8 px-3 text-xs" onClick={() => void onSubmitForApproval()} disabled={submitEvent.isPending}>
            Submit for approval
          </Button>
        )}
        {["draft", "pending", "approved"].includes(event.status) && (
          <Button
            className="h-8 px-3 text-xs"
            variant="outline"
            onClick={() => setCancelDialogOpen(true)}
            disabled={cancelEvent.isPending}
          >
            Cancel event
          </Button>
        )}
      </div>
      <CancelEventDialog
        open={cancelDialogOpen}
        eventTitle={event.title}
        loading={cancelEvent.isPending}
        onCancel={() => setCancelDialogOpen(false)}
        onConfirm={(reason) => {
          cancelEvent.mutate(
            { id: event.id, reason },
            {
              onSuccess: () => {
                setCancelDialogOpen(false);
                setSubmitNotice("Event cancelled. Ticket holders have been notified.");
              },
            },
          );
        }}
      />
      <div className="space-y-8">
        <EventForm mode="edit" initial={event} />
        <EventMediaUpload event={event} />
        <PostponeEventForm event={event} />
        {event.status === "approved" && (
          <>
            <OrganizerAnnouncementForm eventId={event.id} eventTitle={event.title} />
            <OrganizerReviewsPanel eventId={event.id} />
          </>
        )}
      </div>
    </DashboardShell>
  );
}
