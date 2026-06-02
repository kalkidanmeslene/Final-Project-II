"use client";

import { useState } from "react";
import type { EventDetail } from "@/lib/events/event.types";
import { toDateInputValue, toTimeInputValue } from "@/lib/events/format";
import { useEventMutations } from "@/hooks/use-events";
import { FormField } from "@/components/forms/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { ApiClientError } from "@/lib/api/fetch-json";

export function PostponeEventForm({ event }: { event: EventDetail }) {
  const { postponeEvent } = useEventMutations();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (event.status !== "approved") return null;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const fd = new FormData(e.currentTarget);
    try {
      await postponeEvent.mutateAsync({
        id: event.id,
        body: {
          eventDate: fd.get("eventDate"),
          startTime: fd.get("startTime"),
          endTime: fd.get("endTime"),
          reason: fd.get("reason"),
        },
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to postpone event.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <h3 className="font-medium">Postpone event</h3>
      {success && <Alert role="status">Event rescheduled. Attendees will be notified.</Alert>}
      {error && <Alert variant="destructive">{error}</Alert>}
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField id="postponeDate" label="New date" required>
          <Input name="eventDate" type="date" defaultValue={toDateInputValue(event.startsAt)} required />
        </FormField>
        <FormField id="postponeStart" label="Start" required>
          <Input name="startTime" type="time" defaultValue={toTimeInputValue(event.startsAt)} required />
        </FormField>
        <FormField id="postponeEnd" label="End" required>
          <Input name="endTime" type="time" defaultValue={toTimeInputValue(event.endsAt)} required />
        </FormField>
      </div>
      <FormField id="reason" label="Reason" required>
        <textarea
          id="reason"
          name="reason"
          rows={2}
          required
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
      </FormField>
      <Button type="submit" disabled={postponeEvent.isPending}>
        {postponeEvent.isPending ? "Saving..." : "Postpone event"}
      </Button>
    </form>
  );
}
