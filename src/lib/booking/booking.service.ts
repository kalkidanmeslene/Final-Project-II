import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { notifyBookingConfirmed, notifyUser, scheduleEventReminders } from "@/lib/notifications/notification.service";
import { toBookingDto, toTicketDto, toTicketTypeDto } from "./booking.mapper";
import {
  ensureDefaultTicketTypes,
  findBookingByIdForUser,
  findEventForBooking,
  findTicketByCode,
  findTicketTypeById,
  listBookingsByUser,
  listTicketsByUser,
} from "./booking.repository";
import { generatePaymentReference, generateTicketCode } from "./ticket-code";
import type { BookingSummary } from "./booking.types";
import { MAX_TICKETS_PER_ORDER } from "./booking.schemas";

type CheckoutLineInput = { ticketTypeId: string; quantity: number };

type ResolvedCheckoutLine = {
  ticketTypeId: string;
  ticketTypeName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

async function resolveCheckoutLines(
  eventId: string,
  lines: CheckoutLineInput[],
): Promise<
  { ok: true; lines: ResolvedCheckoutLine[] } | { ok: false; code: string; message: string }
> {
  const active = lines.filter((l) => l.quantity > 0);
  if (active.length === 0) {
    return { ok: false, code: "EMPTY_ORDER", message: "Select at least one ticket." };
  }

  const totalQty = active.reduce((sum, l) => sum + l.quantity, 0);
  if (totalQty > MAX_TICKETS_PER_ORDER) {
    return {
      ok: false,
      code: "QUANTITY_LIMIT",
      message: `Maximum ${MAX_TICKETS_PER_ORDER} tickets per order.`,
    };
  }

  const resolved: ResolvedCheckoutLine[] = [];
  for (const line of active) {
    const ticketType = await findTicketTypeById(line.ticketTypeId);
    if (!ticketType || ticketType.eventId !== eventId || !ticketType.isActive) {
      return { ok: false, code: "INVALID_TICKET_TYPE", message: "Invalid ticket type." };
    }

    const available = ticketType.capacity - ticketType.soldCount;
    if (line.quantity > available) {
      return {
        ok: false,
        code: "INSUFFICIENT_CAPACITY",
        message:
          available === 0
            ? `${ticketType.name} is sold out.`
            : `Only ${available} ${ticketType.name} ticket(s) left.`,
      };
    }

    const unitPrice = Number(ticketType.price);
    resolved.push({
      ticketTypeId: ticketType.id,
      ticketTypeName: ticketType.name,
      quantity: line.quantity,
      unitPrice,
      lineTotal: unitPrice * line.quantity,
    });
  }

  return { ok: true, lines: resolved };
}

function buildSummary(
  event: { id: string; title: string; slug: string },
  lines: ResolvedCheckoutLine[],
): BookingSummary {
  const quantity = lines.reduce((sum, l) => sum + l.quantity, 0);
  const lineTotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  return {
    eventId: event.id,
    eventTitle: event.title,
    eventSlug: event.slug,
    lines: lines.map((l) => ({
      ticketTypeId: l.ticketTypeId,
      ticketTypeName: l.ticketTypeName,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      lineTotal: l.lineTotal,
    })),
    quantity,
    lineTotal,
    currency: "ETB",
  };
}

export async function getTicketTypesForEvent(slug: string) {
  const event = await findEventForBooking(slug);
  if (!event) return null;

  const types = await ensureDefaultTicketTypes(
    event.id,
    Number(event.ticketPrice),
    event.capacity,
  );

  return {
    eventId: event.id,
    eventTitle: event.title,
    eventSlug: event.slug,
    ticketTypes: types.map(toTicketTypeDto),
  };
}

export async function previewCheckout(args: {
  eventSlug: string;
  lines: CheckoutLineInput[];
}): Promise<{ ok: true; summary: BookingSummary } | { ok: false; code: string; message: string }> {
  const event = await findEventForBooking(args.eventSlug);
  if (!event) return { ok: false, code: "EVENT_NOT_FOUND", message: "Event not available for booking." };

  const resolved = await resolveCheckoutLines(event.id, args.lines);
  if (!resolved.ok) return resolved;

  return { ok: true, summary: buildSummary(event, resolved.lines) };
}

export async function completeCheckout(args: {
  userId: string;
  eventSlug: string;
  lines: CheckoutLineInput[];
  paymentResult: "success" | "fail";
}) {
  const event = await findEventForBooking(args.eventSlug);
  if (!event) return { ok: false as const, code: "EVENT_NOT_FOUND", message: "Event not available for booking." };

  const resolved = await resolveCheckoutLines(event.id, args.lines);
  if (!resolved.ok) {
    return { ok: false as const, code: resolved.code, message: resolved.message };
  }

  const summary = buildSummary(event, resolved.lines);
  const typeIds = resolved.lines.map((l) => l.ticketTypeId).sort();

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const locked = await tx.$queryRaw<
          { id: string; capacity: number; soldCount: number; price: Prisma.Decimal; name: string; eventId: string }[]
        >`
          SELECT id, capacity, "soldCount", price, name, "eventId"
          FROM "TicketType"
          WHERE id IN (${Prisma.join(typeIds.map((id) => Prisma.sql`${id}`))})
          ORDER BY id
          FOR UPDATE
        `;

        const rowById = new Map(locked.map((row) => [row.id, row]));
        for (const line of resolved.lines) {
          const row = rowById.get(line.ticketTypeId);
          if (!row || row.eventId !== summary.eventId) throw new Error("INVALID_TICKET_TYPE");
          if (line.quantity > row.capacity - row.soldCount) throw new Error("INSUFFICIENT_CAPACITY");
        }

        const referenceCode = generatePaymentReference();
        const bookingInclude = {
          event: { select: { id: true, title: true, slug: true, startsAt: true, venue: true, location: true } },
          lines: { include: { ticketType: { select: { name: true } } } },
          payment: true,
          tickets: {
            include: {
              ticketType: { select: { name: true } },
              event: {
                select: { title: true, slug: true, transferEnabled: true, status: true, endsAt: true },
              },
            },
          },
        } as const;

        const booking = await tx.booking.create({
          data: {
            userId: args.userId,
            eventId: summary.eventId,
            status: "pending",
            totalAmount: summary.lineTotal,
            currency: summary.currency,
            lines: {
              create: resolved.lines.map((line) => ({
                ticketTypeId: line.ticketTypeId,
                quantity: line.quantity,
                unitPrice: line.unitPrice,
                lineTotal: line.lineTotal,
              })),
            },
            payment: {
              create: {
                status: "pending",
                amount: summary.lineTotal,
                referenceCode,
              },
            },
          },
          include: bookingInclude,
        });

        if (args.paymentResult === "fail") {
          await tx.payment.update({
            where: { bookingId: booking.id },
            data: {
              status: "failed",
              failureReason: "Simulated payment declined.",
              processedAt: new Date(),
            },
          });
          await tx.booking.update({
            where: { id: booking.id },
            data: { status: "cancelled" },
          });
          const failedBooking = await tx.booking.findUnique({
            where: { id: booking.id },
            include: bookingInclude,
          });
          return { booking: failedBooking!, paymentFailed: true as const };
        }

        for (const line of resolved.lines) {
          const row = rowById.get(line.ticketTypeId)!;
          const reserve = await tx.ticketType.updateMany({
            where: {
              id: line.ticketTypeId,
              soldCount: { lte: row.capacity - line.quantity },
            },
            data: { soldCount: { increment: line.quantity } },
          });
          if (reserve.count === 0) throw new Error("INSUFFICIENT_CAPACITY");
        }

        await tx.event.update({
          where: { id: summary.eventId },
          data: { ticketsSold: { increment: summary.quantity } },
        });

        const ticketsToCreate: {
          ticketCode: string;
          eventId: string;
          userId: string;
          bookingId: string;
          ticketTypeId: string;
          status: "confirmed";
        }[] = [];

        for (const line of resolved.lines) {
          for (let i = 0; i < line.quantity; i++) {
            let code = generateTicketCode();
            let attempts = 0;
            while (await tx.ticket.findUnique({ where: { ticketCode: code } }) && attempts < 5) {
              code = generateTicketCode();
              attempts++;
            }
            ticketsToCreate.push({
              ticketCode: code,
              eventId: summary.eventId,
              userId: args.userId,
              bookingId: booking.id,
              ticketTypeId: line.ticketTypeId,
              status: "confirmed",
            });
          }
        }

        if (ticketsToCreate.length > 0) {
          await tx.ticket.createMany({ data: ticketsToCreate });
        }

        await tx.payment.update({
          where: { bookingId: booking.id },
          data: { status: "successful", processedAt: new Date() },
        });

        await tx.booking.update({
          where: { id: booking.id },
          data: { status: "confirmed" },
        });

        const full = await tx.booking.findUnique({
          where: { id: booking.id },
          include: bookingInclude,
        });

        return { booking: full!, paymentFailed: false as const };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 20000,
      },
    );

    if (result.paymentFailed) {
      await notifyUser({
        userId: args.userId,
        type: "booking_failed",
        title: "Payment failed",
        body: `Your booking for "${summary.eventTitle}" was not completed.`,
        eventId: summary.eventId,
      });
      return {
        ok: true as const,
        paymentStatus: "failed" as const,
        booking: toBookingDto(result.booking),
      };
    }

    await notifyBookingConfirmed({
      userId: args.userId,
      bookingId: result.booking.id,
      eventId: summary.eventId,
      eventTitle: summary.eventTitle,
      eventSlug: result.booking.event.slug,
      quantity: summary.quantity,
    });

    await scheduleEventReminders({
      userId: args.userId,
      eventId: summary.eventId,
      startsAt: result.booking.event.startsAt,
    });

    return {
      ok: true as const,
      paymentStatus: "successful" as const,
      booking: toBookingDto(result.booking),
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "UNKNOWN";
    if (msg === "INSUFFICIENT_CAPACITY") {
      return { ok: false as const, code: "INSUFFICIENT_CAPACITY", message: "Not enough tickets available." };
    }
    if (msg === "INVALID_TICKET_TYPE") {
      return { ok: false as const, code: "INVALID_TICKET_TYPE", message: "Invalid ticket type." };
    }
    return { ok: false as const, code: "BOOKING_FAILED", message: "Booking failed. Please try again." };
  }
}

export async function getBookingHistory(userId: string) {
  const bookings = await listBookingsByUser(userId);
  return bookings.map(toBookingDto);
}

export async function getMyTickets(userId: string) {
  const tickets = await listTicketsByUser(userId);
  return tickets.map((t) => toTicketDto(t, userId));
}

export async function getBookingDetail(userId: string, bookingId: string) {
  const booking = await findBookingByIdForUser(bookingId, userId);
  if (!booking) return null;
  return toBookingDto(booking);
}

export async function validateTicketOwnership(ticketCode: string, userId: string) {
  const ticket = await findTicketByCode(ticketCode);
  if (!ticket) return { ok: false as const, code: "NOT_FOUND" as const };
  if (ticket.userId !== userId) return { ok: false as const, code: "NOT_OWNER" as const };
  if (ticket.status !== "confirmed") return { ok: false as const, code: "INVALID_STATUS" as const };
  return {
    ok: true as const,
    ticket: {
      ticketCode: ticket.ticketCode,
      eventTitle: ticket.event.title,
      ticketTypeName: ticket.ticketType.name,
      startsAt: ticket.event.startsAt.toISOString(),
    },
  };
}
