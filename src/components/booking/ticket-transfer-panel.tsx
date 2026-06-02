"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { TicketDto } from "@/lib/booking/booking.types";
import { useTicketTransferHistory, useTransferTicket } from "@/hooks/use-transfer";
import { parseTransferRecipient } from "@/lib/transfer/recipient";
import { ApiClientError } from "@/lib/api/fetch-json";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";

export function TicketTransferPanel({ ticket }: { ticket: TicketDto }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const transfer = useTransferTicket(ticket.id);
  const { data: historyData } = useTicketTransferHistory(ticket.id);

  if (!ticket.transferEnabled) {
    return (
      <p className="text-sm text-muted-foreground">Ticket transfers are not enabled for this event.</p>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const recipient = parseTransferRecipient(identifier);
    if (!recipient) {
      setError("Enter the recipient email or phone number.");
      return;
    }
    try {
      await transfer.mutateAsync(recipient);
      const display = recipient.recipientEmail ?? recipient.recipientPhone ?? identifier.trim();
      const message = "Transfer successful! The recipient can use the new QR code in their account.";
      setSuccess(message);
      toast.success("Transfer successful!", {
        description: `Ticket sent to ${display}. Your QR code no longer works.`,
      });
      setIdentifier("");
      setTimeout(() => {
        router.push("/dashboard/attendee/tickets");
        router.refresh();
      }, 2000);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : "Transfer failed.";
      setError(message);
      toast.error(message);
    }
  }

  return (
    <div className="border-t border-border pt-6">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 text-left"
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
      >
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold">Transfer ticket</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Optional — send this ticket to another registered user. Your QR code stops working after transfer.
          </p>
        </div>
        <ChevronDown
          className={cn(
            "mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform",
            expanded && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {expanded ? (
        <div className="mt-6 space-y-6">
          {!ticket.canTransfer && ticket.transferBlockReason && (
            <Alert variant="destructive">{ticket.transferBlockReason}</Alert>
          )}

          {success && (
            <Alert variant="success" role="status">
              {success}
            </Alert>
          )}
          {error && <Alert variant="destructive">{error}</Alert>}

          {ticket.canTransfer && (
            <form onSubmit={handleSubmit} className="max-w-md space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recipientIdentifier">Recipient email or phone</Label>
                <Input
                  id="recipientIdentifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="friend@example.com or 0912345678"
                  required
                />
              </div>
              <Button type="submit" disabled={transfer.isPending}>
                {transfer.isPending ? "Transferring..." : "Transfer ticket"}
              </Button>
            </form>
          )}

          {historyData && historyData.history.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold">Transfer history</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {historyData.history.map((h) => (
                  <li key={h.id} className="rounded-lg border border-border px-3 py-2">
                    <span className="font-mono text-xs">{h.ticketCode}</span>
                    {" · "}
                    {h.fromUserName} → {h.toUserName}
                    <br />
                    <span className="text-xs">{new Date(h.createdAt).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
