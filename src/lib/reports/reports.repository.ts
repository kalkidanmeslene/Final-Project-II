import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { buildDateKeys, initDailyMap, parseReportDateRange } from "./reports.date-range";

function toNum(v: { toString(): string } | number | null | undefined) {
  if (v == null) return 0;
  return typeof v === "number" ? v : Number(v.toString());
}

function eventFilter(organizerId?: string): Prisma.EventWhereInput | undefined {
  return organizerId ? { organizerId } : undefined;
}

export async function getTicketSalesSeries(organizerId: string | undefined, range: ReturnType<typeof parseReportDateRange>) {
  const keys = buildDateKeys(range.from, range.to);
  const map = initDailyMap(keys, () => ({ revenue: 0, tickets: 0, bookings: 0 }));

  const bookings = await prisma.booking.findMany({
    where: {
      status: "confirmed",
      createdAt: { gte: range.from, lte: range.to },
      event: eventFilter(organizerId),
      payment: { status: "successful" },
    },
    select: {
      createdAt: true,
      totalAmount: true,
      lines: { select: { quantity: true } },
    },
  });

  for (const b of bookings) {
    const key = b.createdAt.toISOString().slice(0, 10);
    if (!map.has(key)) continue;
    const cur = map.get(key)!;
    cur.bookings += 1;
    cur.revenue += toNum(b.totalAmount);
    cur.tickets += b.lines.reduce((s, l) => s + l.quantity, 0);
  }

  return keys.map((date) => ({ date, ...map.get(date)! }));
}

export async function getAttendanceSeries(organizerId: string | undefined, range: ReturnType<typeof parseReportDateRange>) {
  const keys = buildDateKeys(range.from, range.to);
  const map = initDailyMap(keys, () => ({ checkedIn: 0, ticketsIssued: 0 }));

  const [checkIns, issued] = await Promise.all([
    prisma.ticket.findMany({
      where: {
        status: "confirmed",
        checkedInAt: { gte: range.from, lte: range.to },
        event: eventFilter(organizerId),
      },
      select: { checkedInAt: true },
    }),
    prisma.ticket.findMany({
      where: {
        status: "confirmed",
        createdAt: { gte: range.from, lte: range.to },
        event: eventFilter(organizerId),
      },
      select: { createdAt: true },
    }),
  ]);

  for (const t of checkIns) {
    if (!t.checkedInAt) continue;
    const key = t.checkedInAt.toISOString().slice(0, 10);
    if (map.has(key)) map.get(key)!.checkedIn += 1;
  }
  for (const t of issued) {
    const key = t.createdAt.toISOString().slice(0, 10);
    if (map.has(key)) map.get(key)!.ticketsIssued += 1;
  }

  return keys.map((date) => {
    const row = map.get(date)!;
    const rate = row.ticketsIssued > 0 ? Math.round((row.checkedIn / row.ticketsIssued) * 100) : 0;
    return { date, ...row, rate };
  });
}

export async function getEventPopularityRows(organizerId: string | undefined, range: ReturnType<typeof parseReportDateRange>) {
  const events = await prisma.event.findMany({
    where: {
      ...(organizerId ? { organizerId } : {}),
      OR: [
        { bookings: { some: { createdAt: { gte: range.from, lte: range.to }, status: "confirmed" } } },
        { startsAt: { gte: range.from, lte: range.to } },
      ],
    },
    include: {
      organizer: { select: { fullName: true } },
      ticketTypes: { select: { soldCount: true, price: true } },
      _count: {
        select: {
          tickets: { where: { status: "confirmed", checkedInAt: { not: null } } },
        },
      },
    },
    take: 50,
  });

  const bookingRevenue = await prisma.booking.groupBy({
    by: ["eventId"],
    where: {
      status: "confirmed",
      createdAt: { gte: range.from, lte: range.to },
      event: eventFilter(organizerId),
      payment: { status: "successful" },
    },
    _sum: { totalAmount: true },
    _count: { id: true },
  });
  const revenueMap = new Map(bookingRevenue.map((r) => [r.eventId, toNum(r._sum.totalAmount)]));

  return events
    .map((e) => {
      const sold = e.ticketTypes.reduce((s, tt) => s + tt.soldCount, 0);
      const typeRevenue = e.ticketTypes.reduce((s, tt) => s + tt.soldCount * toNum(tt.price), 0);
      return {
        eventId: e.id,
        title: e.title,
        slug: e.slug,
        organizerName: e.organizer.fullName,
        ticketsSold: sold,
        capacity: e.capacity,
        revenue: revenueMap.get(e.id) ?? typeRevenue,
        checkIns: e._count.tickets,
        averageRating: e.averageRating != null ? Number(e.averageRating) : null,
      };
    })
    .sort((a, b) => b.revenue - a.revenue || b.ticketsSold - a.ticketsSold);
}

export async function getOrganizerPerformanceRows(range: ReturnType<typeof parseReportDateRange>) {
  const organizers = await prisma.user.findMany({
    where: { role: "organizer", status: "active" },
    select: { id: true, fullName: true },
    take: 100,
  });

  const rows = await Promise.all(
    organizers.map(async (org) => {
      const events = await prisma.event.findMany({
        where: { organizerId: org.id },
        select: {
          id: true,
          capacity: true,
          ticketsSold: true,
          averageRating: true,
          reviewCount: true,
          ticketTypes: { select: { soldCount: true, price: true } },
        },
      });

      const bookings = await prisma.booking.findMany({
        where: {
          status: "confirmed",
          createdAt: { gte: range.from, lte: range.to },
          event: { organizerId: org.id },
          payment: { status: "successful" },
        },
        select: { totalAmount: true, lines: { select: { quantity: true } } },
      });

      const revenue = bookings.reduce((s, b) => s + toNum(b.totalAmount), 0);
      const ticketsSold = bookings.reduce((s, b) => s + b.lines.reduce((x, l) => x + l.quantity, 0), 0);

      const checkIns = await prisma.ticket.count({
        where: {
          status: "confirmed",
          checkedInAt: { gte: range.from, lte: range.to },
          event: { organizerId: org.id },
        },
      });

      let ratingSum = 0;
      let ratingCount = 0;
      for (const e of events) {
        if (e.reviewCount > 0 && e.averageRating != null) {
          ratingSum += Number(e.averageRating) * e.reviewCount;
          ratingCount += e.reviewCount;
        }
      }

      return {
        organizerId: org.id,
        organizerName: org.fullName,
        eventsCount: events.length,
        ticketsSold,
        revenue,
        checkIns,
        averageRating: ratingCount > 0 ? Math.round((ratingSum / ratingCount) * 10) / 10 : null,
      };
    }),
  );

  return rows.filter((r) => r.eventsCount > 0 || r.revenue > 0).sort((a, b) => b.revenue - a.revenue);
}

export async function getRevenueSimulation(organizerId: string | undefined) {
  const events = await prisma.event.findMany({
    where: organizerId ? { organizerId } : {},
    select: {
      ticketsSold: true,
      capacity: true,
      ticketPrice: true,
      ticketTypes: { select: { soldCount: true, capacity: true, price: true } },
    },
  });

  let ticketsSold = 0;
  let totalCapacity = 0;
  let revenue = 0;

  for (const e of events) {
    const sold =
      e.ticketTypes.length > 0
        ? e.ticketTypes.reduce((s, tt) => s + tt.soldCount, 0)
        : e.ticketsSold;
    const cap = e.capacity;
    const eventRevenue =
      e.ticketTypes.length > 0
        ? e.ticketTypes.reduce((s, tt) => s + tt.soldCount * toNum(tt.price), 0)
        : sold * toNum(e.ticketPrice);

    ticketsSold += sold;
    totalCapacity += cap;
    revenue += eventRevenue;
  }

  const remainingCapacity = Math.max(0, totalCapacity - ticketsSold);
  const avgTicketPrice = ticketsSold > 0 ? revenue / ticketsSold : 0;
  const projectedRevenue = revenue + remainingCapacity * avgTicketPrice;

  return {
    actualRevenue: Math.round(revenue),
    projectedRevenue: Math.round(projectedRevenue),
    remainingCapacity,
    sellThroughRate: totalCapacity > 0 ? Math.round((ticketsSold / totalCapacity) * 100) : 0,
  };
}

export async function getValidationActivitySeries(
  organizerId: string | undefined,
  range: ReturnType<typeof parseReportDateRange>,
) {
  const keys = buildDateKeys(range.from, range.to);
  const map = initDailyMap(keys, () => ({
    valid: 0,
    already_used: 0,
    expired: 0,
    invalid: 0,
    total: 0,
  }));

  const scans = await prisma.ticketScan.findMany({
    where: {
      createdAt: { gte: range.from, lte: range.to },
      event: eventFilter(organizerId),
    },
    select: { createdAt: true, result: true },
  });

  for (const s of scans) {
    const key = s.createdAt.toISOString().slice(0, 10);
    if (!map.has(key)) continue;
    const cur = map.get(key)!;
    cur[s.result] += 1;
    cur.total += 1;
  }

  return keys.map((date) => ({ date, ...map.get(date)! }));
}

export async function getUserGrowthSeries(range: ReturnType<typeof parseReportDateRange>) {
  const keys = buildDateKeys(range.from, range.to);
  const map = initDailyMap(keys, () => ({ total: 0, attendees: 0, organizers: 0 }));

  const users = await prisma.user.findMany({
    where: { createdAt: { gte: range.from, lte: range.to } },
    select: { createdAt: true, role: true },
  });

  for (const u of users) {
    const key = u.createdAt.toISOString().slice(0, 10);
    if (!map.has(key)) continue;
    const cur = map.get(key)!;
    cur.total += 1;
    if (u.role === "organizer") cur.organizers += 1;
    else if (u.role === "attendee") cur.attendees += 1;
  }

  return keys.map((date) => ({ date, ...map.get(date)! }));
}

export async function getTransferStatsSeries(organizerId: string | undefined, range: ReturnType<typeof parseReportDateRange>) {
  const keys = buildDateKeys(range.from, range.to);
  const map = initDailyMap(keys, () => ({ count: 0 }));

  const transfers = await prisma.ticketTransfer.findMany({
    where: {
      createdAt: { gte: range.from, lte: range.to },
      event: eventFilter(organizerId),
    },
    select: { createdAt: true },
  });

  for (const t of transfers) {
    const key = t.createdAt.toISOString().slice(0, 10);
    if (map.has(key)) map.get(key)!.count += 1;
  }

  return keys.map((date) => ({ date, ...map.get(date)! }));
}

export async function getReportSummary(
  organizerId: string | undefined,
  range: ReturnType<typeof parseReportDateRange>,
  series: {
    ticketSales: Awaited<ReturnType<typeof getTicketSalesSeries>>;
    attendance: Awaited<ReturnType<typeof getAttendanceSeries>>;
    transferStats: Awaited<ReturnType<typeof getTransferStatsSeries>>;
    userGrowth: Awaited<ReturnType<typeof getUserGrowthSeries>>;
  },
) {
  const revenue = series.ticketSales.reduce((s, r) => s + r.revenue, 0);
  const ticketsSold = series.ticketSales.reduce((s, r) => s + r.tickets, 0);
  const bookings = series.ticketSales.reduce((s, r) => s + r.bookings, 0);
  const checkIns = series.attendance.reduce((s, r) => s + r.checkedIn, 0);
  const ticketsIssued = series.attendance.reduce((s, r) => s + r.ticketsIssued, 0);
  const transfers = series.transferStats.reduce((s, r) => s + r.count, 0);
  const newUsers = series.userGrowth.reduce((s, r) => s + r.total, 0);

  return {
    revenue,
    ticketsSold,
    bookings,
    checkIns,
    transfers,
    newUsers,
    attendanceRate: ticketsIssued > 0 ? Math.round((checkIns / ticketsIssued) * 100) : 0,
  };
}

export { parseReportDateRange };
