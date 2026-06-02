"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import type { TicketDto } from "@/lib/booking/booking.types";
import { useBulkTransferTickets } from "@/hooks/use-transfer";
import { parseTransferRecipient } from "@/lib/transfer/recipient";
import { ApiClientError } from "@/lib/api/fetch-json";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function BulkTicketTransferPanel({ tickets }: { tickets: TicketDto[] }) {
  const router = useRouter();
  const transferable = useMemo(
    () => tickets.filter((t) => t.transferEnabled && t.canTransfer),
    [tickets],
  );

  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState<string | null>(null);
  const bulkTransfer = useBulkTransferTickets();

  if (transferable.length === 0) return null;

  const allSelected = selected.size === transferable.length && transferable.length > 0;

  function toggleTicket(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(transferable.map((t) => t.id)));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const recipient = parseTransferRecipient(identifier);
    if (selected.size === 0) {
      setError("Select at least one ticket.");
      return;
    }
    if (!recipient) {
      setError("Enter the recipient email or phone number.");
      return;
    }

    try {
      const result = await bulkTransfer.mutateAsync({
        ticketIds: [...selected],
        ...recipient,
      });

      const count = result.transferredCount;
      const name = result.recipientName;
      toast.success("Transfer successful!", {
        description: `${count} ticket${count === 1 ? "" : "s"} sent to ${name}.`,
      });

      if (result.failures.length > 0) {
        toast.warning(
          `${result.failures.length} ticket(s) could not be transferred.`,
          { description: result.failures.map((f) => f.message).join(" ") },
        );
      }

      setSelected(new Set());
      setIdentifier("");
      router.refresh();
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : "Transfer failed.";
      setError(message);
      toast.error(message);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <button
          type="button"
          className="flex w-full items-start justify-between gap-3 text-left"
          onClick={() => setExpanded((open) => !open)}
          aria-expanded={expanded}
        >
          <div className="min-w-0 flex-1">
            <CardTitle className="text-lg">Transfer tickets</CardTitle>
            <CardDescription className="mt-1">
              Optional — send tickets to another registered user by email or phone.
            </CardDescription>
          </div>
          <ChevronDown
            className={cn(
              "mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform",
              expanded && "rotate-180",
            )}
            aria-hidden
          />
        </button>
      </CardHeader>
      {expanded ? (
        <CardContent className="space-y-4 border-t border-border pt-4">
        {error && <Alert variant="destructive">{error}</Alert>}

        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">
            {selected.size} of {transferable.length} selected
          </p>
          <Button type="button" variant="outline" size="sm" onClick={toggleAll}>
            {allSelected ? "Clear all" : "Select all"}
          </Button>
        </div>

        <ul className="max-h-56 space-y-2 overflow-y-auto rounded-lg border border-border p-2">
          {transferable.map((ticket) => (
            <li key={ticket.id}>
              <label className="flex cursor-pointer items-start gap-3 rounded-md p-2 hover:bg-muted/50">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={selected.has(ticket.id)}
                  onChange={() => toggleTicket(ticket.id)}
                />
                <span className="min-w-0 flex-1 text-sm">
                  <span className="font-medium">{ticket.eventTitle}</span>
                  <br />
                  <span className="text-muted-foreground">
                    {ticket.ticketTypeName} · <span className="font-mono">{ticket.ticketCode}</span>
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ul>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bulkRecipientIdentifier">Recipient email or phone</Label>
            <Input
              id="bulkRecipientIdentifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="friend@example.com or 0912345678"
              required
            />
          </div>
          <Button type="submit" disabled={bulkTransfer.isPending || selected.size === 0}>
            {bulkTransfer.isPending
              ? "Transferring..."
              : `Transfer ${selected.size || ""} ticket${selected.size === 1 ? "" : "s"}`.trim()}
          </Button>
        </form>
        </CardContent>
      ) : null}
    </Card>
  );
}
