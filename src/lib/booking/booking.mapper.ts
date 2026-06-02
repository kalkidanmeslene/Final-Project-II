import type { Booking, BookingLine, Payment, Ticket, TicketType } from "@prisma/client";
import { evaluateTransferEligibilityFields } from "@/lib/transfer/transfer.service";
import type { BookingDto, PaymentDto, TicketDto, TicketTypeDto } from "./booking.types";

function toNum(d: { toString(): string } | number): number {
  return typeof d === "number" ? d : Number(d.toString());
}

export function toTicketTypeDto(tt: TicketType): TicketTypeDto {
  return {
    id: tt.id,
    name: tt.name,
    description: tt.description,
    price: toNum(tt.price),
    capacity: tt.capacity,
    soldCount: tt.soldCount,
    available: Math.max(0, tt.capacity - tt.soldCount),
  };
}

export function toPaymentDto(p: Payment): PaymentDto {
  return {
    id: p.id,
    status: p.status,
    amount: toNum(p.amount),
    referenceCode: p.referenceCode,
    failureReason: p.failureReason,
    processedAt: p.processedAt?.toISOString() ?? null,
  };
}

type BookingWithRelations = Booking & {
  event: { id: string; title: string; slug: string; startsAt: Date; venue: string; location: string };
  lines: (BookingLine & { ticketType: { name: string } })[];
  payment: Payment | null;
  tickets: (Ticket & {
    ticketType: { name: string };
    event: { title: string; slug: string; transferEnabled: boolean; status: string; endsAt: Date };
  })[];
};

export function toBookingDto(b: BookingWithRelations): BookingDto {
  return {
    id: b.id,
    status: b.status,
    totalAmount: toNum(b.totalAmount),
    currency: b.currency,
    createdAt: b.createdAt.toISOString(),
    event: {
      id: b.event.id,
      title: b.event.title,
      slug: b.event.slug,
      startsAt: b.event.startsAt.toISOString(),
      venue: b.event.venue,
      location: b.event.location,
    },
    lines: b.lines.map((l) => ({
      ticketTypeName: l.ticketType.name,
      quantity: l.quantity,
      unitPrice: toNum(l.unitPrice),
      lineTotal: toNum(l.lineTotal),
    })),
    payment: b.payment ? toPaymentDto(b.payment) : null,
    tickets: b.tickets.map((t) =>
      toTicketDto(
        {
          ...t,
          ticketType: t.ticketType,
          event: {
            title: t.event.title,
            slug: t.event.slug,
            transferEnabled: t.event.transferEnabled,
            status: t.event.status,
            endsAt: t.event.endsAt,
          },
        },
        b.userId,
      ),
    ),
  };
}

type TicketForDto = Ticket & {
  ticketType: { name: string };
  event: {
    title: string;
    slug: string;
    transferEnabled: boolean;
    status: string;
    endsAt: Date;
    startsAt?: Date;
    venue?: string;
  };
};

export function toTicketDto(t: TicketForDto, ownerUserId?: string): TicketDto {
  const eligibility =
    ownerUserId != null
      ? evaluateTransferEligibilityFields({
          ownerUserId,
          ticketUserId: t.userId,
          status: t.status,
          checkedInAt: t.checkedInAt,
          transferEnabled: t.event.transferEnabled,
          eventStatus: t.event.status,
          endsAt: t.event.endsAt,
        })
      : { canTransfer: false, reason: undefined };

  return {
    id: t.id,
    ticketCode: t.ticketCode,
    eventId: t.eventId,
    eventTitle: t.event.title,
    eventSlug: t.event.slug,
    ticketTypeName: t.ticketType.name,
    status: t.status,
    checkedInAt: t.checkedInAt?.toISOString() ?? null,
    transferEnabled: t.event.transferEnabled,
    canTransfer: eligibility.canTransfer,
    transferBlockReason: eligibility.reason ?? null,
    createdAt: t.createdAt.toISOString(),
  };
}
