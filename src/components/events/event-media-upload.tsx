"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import type { EventDetail } from "@/lib/events/event.types";
import { useEventMutations } from "@/hooks/use-events";
import { FormSection } from "@/components/forms/form-section";
import { Alert } from "@/components/ui/alert";
import { ApiClientError } from "@/lib/api/fetch-json";

export function EventMediaUpload({ event: initialEvent }: { event: EventDetail }) {
  const { uploadBanner, uploadGallery } = useEventMutations();
  const [event, setEvent] = useState(initialEvent);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setEvent(initialEvent);
  }, [initialEvent]);

  useEffect(() => {
    if (!success) return;
    const t = window.setTimeout(() => setSuccess(null), 4000);
    return () => window.clearTimeout(t);
  }, [success]);

  async function onBanner(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setSuccess(null);
    try {
      const { event: updated } = await uploadBanner.mutateAsync({ id: event.id, file });
      setEvent(updated);
      setSuccess("Banner uploaded successfully.");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Banner upload failed.");
    }
    e.target.value = "";
  }

  async function onGallery(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setSuccess(null);
    try {
      const { event: updated } = await uploadGallery.mutateAsync({ id: event.id, file });
      setEvent(updated);
      setSuccess("Gallery image added.");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Gallery upload failed.");
    }
    e.target.value = "";
  }

  return (
    <FormSection
      title="Media"
      description="Banner appears on listings and the event hero. Gallery photos are shown on the public event page under Photos."
    >
      {error && (
        <Alert variant="destructive" role="alert" className="mb-4">
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" role="status" className="mb-4 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {success}
        </Alert>
      )}
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-sm font-medium">Banner</p>
          {event.bannerUrl ? (
            <div className="relative mb-2 aspect-[16/9] max-w-md overflow-hidden rounded-lg border border-border bg-zinc-100">
              <Image
                src={event.bannerUrl}
                alt={`${event.title} banner`}
                fill
                className="object-cover"
                sizes="400px"
                unoptimized
              />
            </div>
          ) : (
            <p className="mb-2 text-sm text-muted-foreground">No banner uploaded yet.</p>
          )}
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-secondary/50">
            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={onBanner} />
            {uploadBanner.isPending ? "Uploading…" : event.bannerUrl ? "Replace banner" : "Upload banner"}
          </label>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Gallery</p>
          {event.gallery.length > 0 ? (
            <div className="mb-2 flex flex-wrap gap-2">
              {event.gallery.map((m) => (
                <div
                  key={m.id}
                  className="relative h-20 w-20 overflow-hidden rounded-md border border-border bg-zinc-100"
                >
                  <Image src={m.url} alt="" fill className="object-cover" sizes="80px" unoptimized />
                </div>
              ))}
            </div>
          ) : (
            <p className="mb-2 text-sm text-muted-foreground">No gallery images yet.</p>
          )}
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-secondary/50">
            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={onGallery} />
            {uploadGallery.isPending ? "Uploading…" : "Add gallery image"}
          </label>
        </div>
      </div>
    </FormSection>
  );
}
