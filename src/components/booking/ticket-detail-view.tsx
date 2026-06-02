"use client";

import Link from "next/link";
import { ArrowLeft, AlertCircle, Calendar, MapPin } from "lucide-react";
import type { TicketDto } from "@/lib/booking/booking.types";
import { useEvent } from "@/hooks/use-events";
import { TicketQrDisplay } from "@/components/checkin/ticket-qr-display";
import { TicketTransferPanel } from "@/components/booking/ticket-transfer-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatTime } from "@/lib/format";

export function TicketDetailView({ ticket }: { ticket: TicketDto }) {
  const { data } = useEvent(ticket.eventSlug);
  const event = data?.event;
  const isValid = ticket.status === "confirmed" && !ticket.checkedInAt;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/dashboard/attendee/tickets"
        className="mb-6 inline-flex items-center gap-2 text-primary hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to My Tickets
      </Link>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-lg">
        <div className="bg-primary p-6 text-primary-foreground">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="mb-2 text-2xl font-bold md:text-3xl">{ticket.eventTitle}</h1>
              <Badge variant={isValid ? "success" : "danger"} className="text-xs">
                {ticket.checkedInAt ? "Ticket Used" : isValid ? "Valid Ticket" : ticket.status}
              </Badge>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-80">Ticket ID</p>
              <p className="font-mono font-semibold">{ticket.ticketCode}</p>
            </div>
          </div>
        </div>

        <div className="space-y-8 p-6 md:p-8">
          <div className="rounded-xl border-2 border-primary/20 bg-background p-8">
            <div className="flex flex-col items-center">
              <p className="mb-4 text-center text-sm text-muted-foreground">
                Show this QR code at the event entrance
              </p>
              <div className="rounded-lg bg-card p-6 shadow-inner">
                <TicketQrDisplay ticketId={ticket.id} ticketCode={ticket.ticketCode} />
              </div>
            </div>
          </div>

          {event && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Event Details</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Date & Time</p>
                    <p className="font-semibold">
                      {formatDate(event.startsAt)}
                      <br />
                      {formatTime(event.startsAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-semibold">
                      {event.venue}, {event.location}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 border-t border-border pt-6 md:grid-cols-3">
            <div>
              <p className="mb-1 text-sm text-muted-foreground">Ticket Type</p>
              <p className="font-semibold">{ticket.ticketTypeName}</p>
            </div>
            <div>
              <p className="mb-1 text-sm text-muted-foreground">Purchase Date</p>
              <p className="font-semibold">{formatDate(ticket.createdAt)}</p>
            </div>
            <div>
              <p className="mb-1 text-sm text-muted-foreground">Status</p>
              <p className="font-semibold capitalize">{ticket.status}</p>
            </div>
          </div>

          <TicketTransferPanel ticket={ticket} />

          <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row">
            <Link href={`/events/${ticket.eventSlug}`} className="flex-1">
              <Button variant="outline" className="w-full">
                View Event
              </Button>
            </Link>
          </div>

          <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="mb-1 font-semibold text-amber-900">Important Notice</p>
              <p className="text-sm text-amber-800">
                This QR code is unique to your ticket. Do not share screenshots of this code.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
