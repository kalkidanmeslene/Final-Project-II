import type { BookingSummary } from "@/lib/booking/booking.types";
import { formatCurrency } from "@/lib/format";

export function BookingSummaryCard({ summary }: { summary: BookingSummary }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-bold">Booking summary</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Event</span>
          <span className="font-medium">{summary.eventTitle}</span>
        </div>
        {summary.lines.map((line) => (
          <div key={line.ticketTypeId} className="flex justify-between gap-4">
            <span className="text-muted-foreground">
              {line.ticketTypeName} × {line.quantity}
            </span>
            <span>{formatCurrency(line.lineTotal)}</span>
          </div>
        ))}
        <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
          <span>Total ({summary.quantity} tickets)</span>
          <span className="text-primary">{formatCurrency(summary.lineTotal)}</span>
        </div>
      </div>
    </div>
  );
}
