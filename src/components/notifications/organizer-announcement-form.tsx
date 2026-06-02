"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ApiClientError } from "@/lib/api/fetch-json";
import { useNotificationMutations } from "@/hooks/use-notifications";
import { FormSection } from "@/components/forms/form-section";
import { FormField } from "@/components/forms/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function OrganizerAnnouncementForm({ eventId, eventTitle }: { eventId: string; eventTitle: string }) {
  const { sendAnnouncement } = useNotificationMutations();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const result = await sendAnnouncement.mutateAsync({ eventId, title, message });
      toast.success(`Announcement sent to ${result.recipientCount} attendee(s).`);
      setTitle("");
      setMessage("");
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Could not send announcement.");
    }
  }

  return (
    <FormSection
      title="Announce to attendees"
      description={`Send an in-app and email announcement to ticket holders for "${eventTitle}".`}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField id="announcement-title" label="Title">
          <Input
            id="announcement-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Important update"
            required
            minLength={3}
            maxLength={120}
          />
        </FormField>
        <FormField id="announcement-message" label="Message">
          <textarea
            id="announcement-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Share details with your attendees..."
            required
            minLength={5}
            maxLength={2000}
            rows={4}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </FormField>
        <Button type="submit" variant="primary" disabled={sendAnnouncement.isPending}>
          {sendAnnouncement.isPending ? "Sending..." : "Send announcement"}
        </Button>
      </form>
    </FormSection>
  );
}
