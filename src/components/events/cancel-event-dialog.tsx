"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function CancelEventDialog({
  open,
  eventTitle,
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  eventTitle: string;
  loading?: boolean;
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState("");

  if (!open) return null;

  function handleClose() {
    setReason("");
    onCancel();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close" onClick={handleClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-event-title"
        className="relative z-10 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg"
      >
        <h3 id="cancel-event-title" className="text-lg font-semibold">
          Cancel event
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Cancel <span className="font-medium text-foreground">{eventTitle}</span>? Ticket holders will be
          notified and new bookings will stop.
        </p>
        <div className="mt-4 space-y-2">
          <Label htmlFor="cancelReason">Reason (optional)</Label>
          <textarea
            id="cancelReason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="e.g. Venue unavailable"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Keep event
          </Button>
          <Button
            variant="danger"
            onClick={() => onConfirm(reason.trim() || undefined)}
            disabled={loading}
          >
            {loading ? "Cancelling…" : "Cancel event"}
          </Button>
        </div>
      </div>
    </div>
  );
}
