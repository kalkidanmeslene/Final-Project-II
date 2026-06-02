"use client";

import Link from "next/link";
import { Calendar, MapPin, QrCode } from "lucide-react";
import type { TicketDto } from "@/lib/booking/booking.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEvent } from "@/hooks/use-events";

function TicketListItem({ ticket }: { ticket: TicketDto }) {
  const { data } = useEvent(ticket.eventSlug);
  const event = data?.event;
  const isValid = ticket.status === "confirmed" && !ticket.checkedInAt;

  return (
    <Link href={`/dashboard/attendee/tickets/${ticket.id}`}>
      <div className="cursor-pointer rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
        <div className="flex flex-col gap-6 md:flex-row">
          <div className="flex-1">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h3 className="mb-2 text-xl font-semibold">{ticket.eventTitle}</h3>
                <Badge variant={isValid ? "success" : "danger"}>
                  {ticket.checkedInAt ? "Used" : isValid ? "Valid" : ticket.status}
                </Badge>
              </div>
              <QrCode className="h-8 w-8 shrink-0 text-primary" />
            </div>
            <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
              {event && (
                <>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>{new Date(event.startsAt).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>
                      {event.venue}, {event.location}
                    </span>
                  </div>
                </>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <div>
                <p className="text-sm text-muted-foreground">Ticket Type</p>
                <p className="font-semibold">{ticket.ticketTypeName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Code</p>
                <p className="font-mono text-sm">{ticket.ticketCode}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function AttendeeTicketsList({
  tickets,
  showHeader = true,
}: {
  tickets: TicketDto[];
  showHeader?: boolean;
}) {
  return (
    <div className="space-y-6">
      {showHeader && (
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">My Tickets</h2>
          <Link href="/events">
            <Button>Browse Events</Button>
          </Link>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4">
        {tickets.map((ticket) => (
          <TicketListItem key={ticket.id} ticket={ticket} />
        ))}
      </div>
    </div>
  );
}
