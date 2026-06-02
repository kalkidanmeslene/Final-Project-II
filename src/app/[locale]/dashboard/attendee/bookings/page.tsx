"use client";

import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { useBookingHistory } from "@/hooks/use-booking";
import { formatEventDate, formatPrice } from "@/lib/events/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Alert } from "@/components/ui/alert";

export default function BookingHistoryPage() {
  const { data, isLoading, isError } = useBookingHistory();

  return (
    <DashboardShell title="Booking history">
      {isLoading && <Spinner label="Loading bookings" />}
      {isError && <Alert variant="destructive">Failed to load booking history.</Alert>}
      {!isLoading && data?.bookings.length === 0 && (
        <p className="text-sm text-zinc-500">No bookings yet.</p>
      )}
      <div className="space-y-4">
        {data?.bookings.map((b) => (
          <Card key={b.id}>
            <CardHeader>
              <CardTitle className="text-lg">{b.event.title}</CardTitle>
              <p className="text-sm text-zinc-500">{formatEventDate(b.event.startsAt)}</p>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                Status: <span className="font-medium capitalize">{b.status}</span>
                {b.payment && (
                  <>
                    {" "}
                    · Payment: <span className="capitalize">{b.payment.status}</span>
                  </>
                )}
              </p>
              <p>Total: {formatPrice(b.totalAmount)}</p>
              {b.lines.map((l, i) => (
                <p key={i}>
                  {l.quantity}× {l.ticketTypeName} — {formatPrice(l.lineTotal)}
                </p>
              ))}
              {b.payment?.referenceCode && (
                <p className="font-mono text-xs">Ref: {b.payment.referenceCode}</p>
              )}
              {b.status === "confirmed" && (
                <Link href="/dashboard/attendee/tickets" className="underline">
                  View tickets
                </Link>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardShell>
  );
}
