"use client";

import Link from "next/link";
import { QrCode } from "lucide-react";
import type { TicketDto } from "@/lib/booking/booking.types";
import { Badge } from "@/components/ui/badge";

export function TicketCard({ ticket }: { ticket: TicketDto }) {
  const isValid = ticket.status === "confirmed" && !ticket.checkedInAt;

  return (
    <Link href={`/dashboard/attendee/tickets/${ticket.id}`}>
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">{ticket.eventTitle}</h3>
            <p className="mt-1 font-mono text-sm text-muted-foreground">{ticket.ticketCode}</p>
          </div>
          <QrCode className="h-6 w-6 shrink-0 text-primary" />
        </div>
        <Badge variant={isValid ? "success" : "danger"} className="mb-3">
          {ticket.checkedInAt ? "Used" : isValid ? "Valid" : ticket.status}
        </Badge>
        <p className="text-sm text-muted-foreground">{ticket.ticketTypeName}</p>
        {ticket.checkedInAt && (
          <p className="mt-1 text-xs text-success">
            Checked in {new Date(ticket.checkedInAt).toLocaleString()}
          </p>
        )}
      </div>
    </Link>
  );
}
