export type PurchasedTicketLine = {
  ticketTypeName: string;
  quantity: number;
};

export function formatPurchasedTickets(lines: PurchasedTicketLine[]): string | null {
  if (lines.length === 0) return null;
  return lines.map((l) => `${l.quantity}× ${l.ticketTypeName}`).join(", ");
}
