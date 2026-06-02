"use client";

import type { TicketTypeDto } from "@/lib/booking/booking.types";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

export function TicketTypeSelector({
  types,
  selectedId,
  onSelect,
}: {
  types: TicketTypeDto[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Ticket type">
      {types.map((t) => {
        const selected = selectedId === t.id;
        const soldOut = t.available === 0;
        return (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={soldOut}
            onClick={() => onSelect(t.id)}
            className={cn(
              "rounded-xl border p-4 text-left transition-all",
              selected ? "border-primary bg-primary/5 ring-2 ring-primary/30" : "border-border bg-background",
              soldOut && "cursor-not-allowed opacity-50",
            )}
          >
            <p className="font-medium">{t.name}</p>
            {t.description && <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>}
            <p className="mt-2 font-semibold text-primary">
              {t.price === 0 ? "Free" : formatCurrency(t.price)}
            </p>
            <p className="text-xs text-muted-foreground">{soldOut ? "Sold out" : "Available"}</p>
          </button>
        );
      })}
    </div>
  );
}
