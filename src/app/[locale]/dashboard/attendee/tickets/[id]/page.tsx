"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { TicketDetailView } from "@/components/booking/ticket-detail-view";
import { useMyTickets } from "@/hooks/use-booking";
import { Spinner } from "@/components/ui/spinner";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function TicketDetailPage() {
  const params = useParams();
  const ticketId = String(params.id ?? "");
  const { data, isLoading, isError } = useMyTickets();
  const ticket = data?.tickets.find((t) => t.id === ticketId);

  return (
    <DashboardShell hideTitle>
      {isLoading && <Spinner label="Loading ticket" />}
      {isError && <Alert variant="destructive">Failed to load ticket.</Alert>}
      {!isLoading && !ticket && (
        <div className="py-16 text-center">
          <h2 className="text-2xl font-bold">Ticket not found</h2>
          <Link href="/dashboard/attendee/tickets">
            <Button className="mt-4">Back to My Tickets</Button>
          </Link>
        </div>
      )}
      {ticket && <TicketDetailView ticket={ticket} />}
    </DashboardShell>
  );
}
