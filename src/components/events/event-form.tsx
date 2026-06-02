"use client";

import { useEffect, useState } from "react";
import { ApiClientError } from "@/lib/api/fetch-json";
import type { EventDetail } from "@/lib/events/event.types";
import { toDateInputValue, toTimeInputValue } from "@/lib/events/format";
import { useEventCategories, useEventMutations } from "@/hooks/use-events";
import { FormField } from "@/components/forms/form-field";
import { FormSection } from "@/components/forms/form-section";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { CategorySuggestButton } from "@/components/ai/category-suggest-button";
import { TranslationHelper } from "@/components/ai/translation-helper";

type Props = {
  mode: "create" | "edit";
  initial?: EventDetail;
  showHeader?: boolean;
};

const selectClass =
  "flex h-11 w-full rounded-lg border border-input bg-input-background px-4 text-sm text-foreground transition-all focus:border-transparent focus:ring-2 focus:ring-ring focus:outline-none";

const textareaClass =
  "w-full resize-none rounded-lg border border-input bg-input-background px-4 py-3 text-sm text-foreground transition-all placeholder:text-muted-foreground focus:border-transparent focus:ring-2 focus:ring-ring focus:outline-none";

export function EventForm({ mode, initial, showHeader = false }: Props) {
  const router = useRouter();
  const { data: categoriesData } = useEventCategories();
  const { createEvent, updateEvent, submitEvent } = useEventMutations();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [categoryId, setCategoryId] = useState(initial?.category.id ?? "");

  const pending = createEvent.isPending || updateEvent.isPending || submitEvent.isPending;

  useEffect(() => {
    if (!success) return;
    const t = window.setTimeout(() => setSuccess(null), 6000);
    return () => window.clearTimeout(t);
  }, [success]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>, saveAsDraft: boolean) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setFieldErrors({});
    const fd = new FormData(e.currentTarget);

    const body: Record<string, unknown> = {
      title: fd.get("title"),
      description: fd.get("description"),
      categoryId: fd.get("categoryId"),
      location: fd.get("location"),
      venue: fd.get("venue"),
      eventDate: fd.get("eventDate"),
      startTime: fd.get("startTime"),
      endTime: fd.get("endTime"),
      ticketPrice: fd.get("ticketPrice"),
      capacity: fd.get("capacity"),
      visibility: fd.get("visibility"),
      transferEnabled: fd.get("transferEnabled") === "on",
      saveAsDraft,
    };

    try {
      if (mode === "create") {
        const res = await createEvent.mutateAsync(body);
        const notice = saveAsDraft ? "draft" : "submitted";
        router.push(`/dashboard/organizer/events/${res.event.id}/edit?notice=${notice}`);
      } else if (initial) {
        await updateEvent.mutateAsync({ id: initial.id, body });
        if (!saveAsDraft && initial.status === "draft") {
          await submitEvent.mutateAsync(initial.id);
          setSuccess("Event submitted for approval. An admin will review it soon.");
        } else if (saveAsDraft) {
          setSuccess("Draft saved.");
        } else {
          setSuccess("Changes saved.");
        }
        router.refresh();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
        if (err.fieldErrors) {
          const m: Record<string, string> = {};
          for (const [k, v] of Object.entries(err.fieldErrors)) m[k] = v[0] ?? "";
          setFieldErrors(m);
        }
      } else {
        setError("Failed to save event.");
      }
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void handleSubmit(e, false);
      }}
      className="space-y-6"
      noValidate
    >
      {showHeader && (
        <>
          <Link
            href="/dashboard/organizer"
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <div>
            <h2 className="text-3xl font-bold text-foreground">Create New Event</h2>
            <p className="mt-2 text-muted-foreground">
              Fill in the details below. You can save an incomplete form as a draft and finish it later.
            </p>
          </div>
        </>
      )}

      {success && (
        <Alert variant="success" role="status" className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {success}
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" role="alert">
          {error}
        </Alert>
      )}

      <FormSection title="Basic Information">
        <div className="grid gap-6 md:grid-cols-2">
          <FormField id="title" label="Event Title" error={fieldErrors.title} className="md:col-span-2">
            <Input
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ethiopian Jazz Night"
            />
          </FormField>
          <FormField id="categoryId" label="Category" error={fieldErrors.categoryId}>
            <select id="categoryId" name="categoryId" defaultValue={initial?.category.id} className={selectClass}>
              <option value="">Select category</option>
              {categoriesData?.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField id="visibility" label="Visibility" error={fieldErrors.visibility}>
            <select id="visibility" name="visibility" defaultValue={initial?.visibility ?? "public"} className={selectClass}>
              <option value="public">Public (listed)</option>
              <option value="unlisted">Unlisted (direct link only)</option>
              <option value="private">Private (organizer only)</option>
            </select>
          </FormField>
          <FormField id="description" label="Description" error={fieldErrors.description} className="md:col-span-2">
            <textarea
              id="description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              placeholder="Describe your event..."
              className={textareaClass}
            />
            <TranslationHelper text={description} onApply={setDescription} />
          </FormField>
        </div>
      </FormSection>

      <FormSection title="Date & Location">
        <div className="grid gap-6 md:grid-cols-2">
          <FormField id="location" label="Location (city/region)" error={fieldErrors.location}>
            <Input name="location" defaultValue={initial?.location} placeholder="Addis Ababa" />
          </FormField>
          <FormField id="venue" label="Venue" error={fieldErrors.venue}>
            <Input name="venue" defaultValue={initial?.venue} placeholder="Sheraton Addis" />
          </FormField>
          <FormField id="eventDate" label="Event Date" error={fieldErrors.eventDate}>
            <Input
              name="eventDate"
              type="date"
              defaultValue={initial ? toDateInputValue(initial.startsAt) : undefined}
            />
          </FormField>
          <FormField id="startTime" label="Start time" error={fieldErrors.startTime}>
            <Input
              name="startTime"
              type="time"
              defaultValue={initial ? toTimeInputValue(initial.startsAt) : undefined}
            />
          </FormField>
          <FormField id="endTime" label="End time" error={fieldErrors.endTime}>
            <Input
              name="endTime"
              type="time"
              defaultValue={initial ? toTimeInputValue(initial.endsAt) : undefined}
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection title="Tickets & Pricing">
        <div className="grid gap-6 md:grid-cols-2">
          <FormField id="ticketPrice" label="Ticket Price (ETB)" error={fieldErrors.ticketPrice}>
            <Input name="ticketPrice" type="number" min="0" step="0.01" defaultValue={initial?.ticketPrice ?? 0} placeholder="500" />
          </FormField>
          <FormField id="capacity" label="Total Capacity" error={fieldErrors.capacity}>
            <Input name="capacity" type="number" min="1" defaultValue={initial?.capacity ?? 100} placeholder="500" />
          </FormField>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="transferEnabled"
            defaultChecked={initial?.transferEnabled ?? true}
            className="h-4 w-4 rounded border-border"
          />
          Allow attendees to transfer tickets to other registered users
        </label>
      </FormSection>

      <p className="text-sm text-muted-foreground">
        Required fields are enforced when you submit for approval. Save as draft anytime with partial details.
      </p>

      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="outline" size="lg" disabled={pending} onClick={(e) => {
            const form = (e.target as HTMLElement).closest("form");
            if (form) void handleSubmit({ preventDefault: () => {}, currentTarget: form } as React.FormEvent<HTMLFormElement>, true);
          }}
        >
          Save as draft
        </Button>
        <Button type="submit" size="lg" disabled={pending}>
          {mode === "create" ? "Submit for approval" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
