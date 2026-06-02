"use client";

import Link from "next/link";
import { Ticket } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AttendeeTicketsList } from "@/components/booking/attendee-tickets-list";
import { BulkTicketTransferPanel } from "@/components/booking/bulk-ticket-transfer-panel";
import { useMyTickets } from "@/hooks/use-booking";
import { Spinner } from "@/components/ui/spinner";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function MyTicketsPage() {
  const { data, isLoading, isError } = useMyTickets();

  return (
    <DashboardShell title="My tickets">
      {isLoading && <Spinner label="Loading tickets" />}
      {isError && <Alert variant="destructive">Failed to load tickets.</Alert>}
      {!isLoading && data?.tickets.length === 0 && (
        <div className="py-16 text-center">
          <Ticket className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h3 className="mb-2 text-xl font-semibold">No tickets yet</h3>
          <p className="mb-6 text-muted-foreground">Browse events to book your first ticket.</p>
          <Link href="/events">
            <Button>Browse Events</Button>
          </Link>
        </div>
      )}
      {data && data.tickets.length > 0 && (
        <div className="space-y-8">
          <AttendeeTicketsList tickets={data.tickets} showHeader={false} />
          <BulkTicketTransferPanel tickets={data.tickets} />
        </div>
      )}
    </DashboardShell>
  );
}
