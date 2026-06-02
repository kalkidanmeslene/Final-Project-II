import { formatPurchasedTickets, type PurchasedTicketLine } from "@/lib/checkin/format-purchased-tickets";

export function PurchasedTicketsLabel({
  purchasedTickets,
  scannedTicketTypeName,
  showOrderSummary = true,
  className,
}: {
  purchasedTickets: PurchasedTicketLine[];
  scannedTicketTypeName?: string | null;
  showOrderSummary?: boolean;
  className?: string;
}) {
  const orderSummary = showOrderSummary ? formatPurchasedTickets(purchasedTickets) : null;

  if (!orderSummary && !scannedTicketTypeName) return null;

  return (
    <div className={className}>
      {orderSummary && (
        <p>
          <span className="text-muted-foreground">Order: </span>
          <span className="font-medium text-foreground">{orderSummary}</span>
        </p>
      )}
      {scannedTicketTypeName && (
        <p>
          <span className="text-muted-foreground">This QR: </span>
          <span className="font-medium text-foreground">1× {scannedTicketTypeName}</span>
        </p>
      )}
    </div>
  );
}
