import type { Prisma, ScanResult } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function findEventForCheckin(eventId: string) {
  return prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      title: true,
      slug: true,
      organizerId: true,
      status: true,
      startsAt: true,
      endsAt: true,
    },
  });
}

const bookingLinesInclude = {
  lines: {
    include: { ticketType: { select: { name: true } } },
    orderBy: { ticketType: { sortOrder: "asc" as const } },
  },
} as const;

export async function findTicketForScan(ticketId: string) {
  return prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      user: { select: { id: true, fullName: true, email: true } },
      ticketType: { select: { name: true } },
      event: { select: { id: true, endsAt: true, status: true, title: true } },
      booking: { include: bookingLinesInclude },
    },
  });
}

export async function findTicketForOwner(ticketId: string, userId: string) {
  return prisma.ticket.findFirst({
    where: { id: ticketId, userId, status: "confirmed" },
    include: {
      event: { select: { id: true, endsAt: true, title: true, slug: true } },
      ticketType: { select: { name: true } },
    },
  });
}

export async function createScanLog(data: {
  eventId: string;
  ticketId: string | null;
  scannedById: string;
  result: ScanResult;
  ticketCode?: string | null;
  detail?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  return prisma.ticketScan.create({ data });
}

export async function listScanHistory(
  eventId: string,
  opts: { limit?: number; cursor?: string } = {},
) {
  const take = opts.limit ?? 50;
  return prisma.ticketScan.findMany({
    where: { eventId },
    take,
    ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
    include: {
      scannedBy: { select: { fullName: true } },
      ticket: {
        select: {
          ticketCode: true,
          user: { select: { fullName: true } },
          ticketType: { select: { name: true } },
          booking: { include: bookingLinesInclude },
        },
      },
    },
  });
}

export async function getCheckinAnalytics(eventId: string) {
  const [totalTickets, checkedIn, scanGroups, recentValid] = await Promise.all([
    prisma.ticket.count({ where: { eventId, status: "confirmed" } }),
    prisma.ticket.count({ where: { eventId, status: "confirmed", checkedInAt: { not: null } } }),
    prisma.ticketScan.groupBy({
      by: ["result"],
      where: { eventId },
      _count: { result: true },
    }),
    prisma.ticket.findMany({
      where: { eventId, checkedInAt: { not: null } },
      orderBy: { checkedInAt: "desc" },
      take: 10,
      select: {
        ticketCode: true,
        checkedInAt: true,
        user: { select: { fullName: true } },
        ticketType: { select: { name: true } },
        booking: { include: bookingLinesInclude },
      },
    }),
  ]);

  const scanCounts = {
    valid: 0,
    already_used: 0,
    expired: 0,
    invalid: 0,
  };
  for (const row of scanGroups) {
    scanCounts[row.result] = row._count.result;
  }

  return {
    totalTickets,
    checkedIn,
    remaining: Math.max(0, totalTickets - checkedIn),
    scanCounts,
    recentValid: recentValid
      .filter((t) => t.checkedInAt)
      .map((t) => ({
        ticketCode: t.ticketCode,
        holderName: t.user.fullName,
        ticketTypeName: t.ticketType.name,
        purchasedTickets: t.booking.lines.map((l) => ({
          ticketTypeName: l.ticketType.name,
          quantity: l.quantity,
        })),
        checkedInAt: t.checkedInAt!.toISOString(),
      })),
  };
}

export async function listEventStaff(eventId: string) {
  return prisma.eventStaff.findMany({
    where: { eventId },
    include: { user: { select: { id: true, fullName: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function addEventStaff(data: Prisma.EventStaffCreateInput) {
  return prisma.eventStaff.create({
    data,
    include: { user: { select: { id: true, fullName: true, email: true } } },
  });
}

export async function removeEventStaff(eventId: string, staffId: string) {
  return prisma.eventStaff.deleteMany({ where: { id: staffId, eventId } });
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, fullName: true, email: true, role: true, status: true },
  });
}
