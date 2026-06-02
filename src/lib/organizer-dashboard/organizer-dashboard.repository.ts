import { prisma } from "@/lib/db";

export async function findOrganizerEvents(organizerId: string) {
  return prisma.event.findMany({
    where: { organizerId },
    include: {
      category: { select: { name: true } },
      ticketTypes: { select: { soldCount: true, capacity: true, price: true } },
    },
    orderBy: { startsAt: "desc" },
  });
}

export async function verifyOrganizerOwnsEvent(eventId: string, organizerId: string) {
  return prisma.event.findFirst({
    where: { id: eventId, organizerId },
    select: { id: true, title: true },
  });
}

export async function getConfirmedBookingsSince(organizerId: string, since: Date) {
  return prisma.booking.findMany({
    where: {
      status: "confirmed",
      createdAt: { gte: since },
      event: { organizerId },
      payment: { status: "successful" },
    },
    select: {
      createdAt: true,
      totalAmount: true,
      lines: { select: { quantity: true } },
    },
  });
}

export async function getOrganizerCheckinAggregates(organizerId: string) {
  const eventIds = (
    await prisma.event.findMany({
      where: { organizerId },
      select: { id: true },
    })
  ).map((e) => e.id);

  if (eventIds.length === 0) {
    return {
      totalTickets: 0,
      checkedIn: 0,
      scanCounts: { valid: 0, already_used: 0, expired: 0, invalid: 0 },
    };
  }

  const [totalTickets, checkedIn, scanGroups] = await Promise.all([
    prisma.ticket.count({ where: { eventId: { in: eventIds }, status: "confirmed" } }),
    prisma.ticket.count({
      where: { eventId: { in: eventIds }, status: "confirmed", checkedInAt: { not: null } },
    }),
    prisma.ticketScan.groupBy({
      by: ["result"],
      where: { eventId: { in: eventIds } },
      _count: { result: true },
    }),
  ]);

  const scanCounts = { valid: 0, already_used: 0, expired: 0, invalid: 0 };
  for (const row of scanGroups) {
    scanCounts[row.result] = row._count.result;
  }

  return { totalTickets, checkedIn, scanCounts };
}

export async function getEventCheckinCounts(eventIds: string[]) {
  if (eventIds.length === 0) return new Map<string, number>();
  const rows = await prisma.ticket.groupBy({
    by: ["eventId"],
    where: { eventId: { in: eventIds }, status: "confirmed", checkedInAt: { not: null } },
    _count: { id: true },
  });
  return new Map(rows.map((r) => [r.eventId, r._count.id]));
}

export async function listOrganizerTransfers(organizerId: string, limit = 15) {
  return prisma.ticketTransfer.findMany({
    where: { event: { organizerId } },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      fromUser: { select: { fullName: true } },
      toUser: { select: { fullName: true } },
      event: { select: { title: true } },
      ticket: { select: { ticketCode: true } },
    },
  });
}

export async function listOrganizerFeedback(organizerId: string, limit = 15) {
  return prisma.eventReview.findMany({
    where: { event: { organizerId } },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { fullName: true } },
      event: { select: { title: true } },
    },
  });
}

export async function countPendingReviews(organizerId: string) {
  return prisma.eventReview.count({
    where: { event: { organizerId }, status: "pending" },
  });
}

export async function listEventAttendees(eventId: string) {
  return prisma.ticket.findMany({
    where: { eventId, status: "confirmed" },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { fullName: true, email: true, phoneNumber: true } },
      ticketType: { select: { name: true } },
    },
  });
}

export async function countOrganizerTransfers(organizerId: string) {
  return prisma.ticketTransfer.count({ where: { event: { organizerId } } });
}
