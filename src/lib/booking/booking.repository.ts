import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const bookingInclude = {
  event: { select: { id: true, title: true, slug: true, startsAt: true, venue: true, location: true } },
  lines: { include: { ticketType: { select: { name: true } } } },
  payment: true,
  tickets: {
    include: {
      ticketType: { select: { name: true } },
      event: {
        select: {
          title: true,
          slug: true,
          transferEnabled: true,
          status: true,
          endsAt: true,
        },
      },
    },
  },
} satisfies Prisma.BookingInclude;

export async function findEventForBooking(slug: string) {
  return prisma.event.findFirst({
    where: { slug, status: "approved" },
    select: { id: true, title: true, slug: true, ticketPrice: true, capacity: true },
  });
}

export async function findTicketTypesByEventId(eventId: string) {
  return prisma.ticketType.findMany({
    where: { eventId, isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function findTicketTypeById(id: string) {
  return prisma.ticketType.findUnique({
    where: { id },
    include: { event: { select: { id: true, title: true, slug: true, status: true } } },
  });
}

export async function ensureDefaultTicketTypes(eventId: string, defaultPrice: number, defaultCapacity: number) {
  const existing = await prisma.ticketType.count({ where: { eventId } });
  if (existing > 0) return findTicketTypesByEventId(eventId);

  const isFree = defaultPrice <= 0;

  await prisma.ticketType.create({
    data: {
      eventId,
      name: "General Admission",
      description: "Standard entry",
      price: defaultPrice,
      capacity: defaultCapacity,
      sortOrder: 0,
    },
  });

  if (!isFree) {
    await prisma.ticketType.create({
      data: {
        eventId,
        name: "VIP",
        description: "Premium seating and perks",
        price: defaultPrice * 1.5,
        capacity: Math.max(10, Math.floor(defaultCapacity * 0.2)),
        sortOrder: 1,
      },
    });
  }

  return findTicketTypesByEventId(eventId);
}

export async function findBookingById(id: string) {
  return prisma.booking.findUnique({ where: { id }, include: bookingInclude });
}

export async function findBookingByIdForUser(id: string, userId: string) {
  return prisma.booking.findFirst({ where: { id, userId }, include: bookingInclude });
}

export async function listBookingsByUser(userId: string) {
  return prisma.booking.findMany({
    where: { userId },
    include: bookingInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function listTicketsByUser(userId: string) {
  return prisma.ticket.findMany({
    where: { userId, status: "confirmed" },
    include: {
      ticketType: { select: { name: true } },
      event: {
        select: {
          title: true,
          slug: true,
          startsAt: true,
          venue: true,
          transferEnabled: true,
          status: true,
          endsAt: true,
        },
      },
      booking: { select: { id: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function findTicketByCode(ticketCode: string) {
  return prisma.ticket.findUnique({
    where: { ticketCode },
    include: {
      user: { select: { id: true, fullName: true, email: true } },
      event: { select: { title: true, slug: true, startsAt: true } },
      ticketType: { select: { name: true } },
    },
  });
}

export async function ticketCodeExists(code: string) {
  const t = await prisma.ticket.findUnique({ where: { ticketCode: code }, select: { id: true } });
  return !!t;
}

export { bookingInclude };
