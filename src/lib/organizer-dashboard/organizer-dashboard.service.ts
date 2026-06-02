import type { UserRole } from "@prisma/client";
import type { OrganizerDashboardData, AttendeeRow } from "./organizer-dashboard.types";
import {
  countOrganizerTransfers,
  countPendingReviews,
  findOrganizerEvents,
  getConfirmedBookingsSince,
  getEventCheckinCounts,
  getOrganizerCheckinAggregates,
  listEventAttendees,
  listOrganizerFeedback,
  listOrganizerTransfers,
  verifyOrganizerOwnsEvent,
} from "./organizer-dashboard.repository";

function toNumber(price: { toString(): string } | number) {
  return typeof price === "number" ? price : Number(price.toString());
}

function groupSalesByDay(
  bookings: Awaited<ReturnType<typeof getConfirmedBookingsSince>>,
  days: number,
) {
  const map = new Map<string, { revenue: number; tickets: number }>();
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    map.set(key, { revenue: 0, tickets: 0 });
  }
  for (const b of bookings) {
    const key = b.createdAt.toISOString().slice(0, 10);
    if (!map.has(key)) continue;
    const cur = map.get(key)!;
    cur.revenue += toNumber(b.totalAmount);
    cur.tickets += b.lines.reduce((s, l) => s + l.quantity, 0);
  }
  return Array.from(map.entries()).map(([date, v]) => ({ date, ...v }));
}

export async function buildOrganizerDashboard(organizerId: string): Promise<OrganizerDashboardData> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [events, bookings, checkinSummary, transfers, feedback, pendingReviewsCount, totalTransfers] =
    await Promise.all([
      findOrganizerEvents(organizerId),
      getConfirmedBookingsSince(organizerId, since),
      getOrganizerCheckinAggregates(organizerId),
      listOrganizerTransfers(organizerId),
      listOrganizerFeedback(organizerId),
      countPendingReviews(organizerId),
      countOrganizerTransfers(organizerId),
    ]);

  const eventIds = events.map((e) => e.id);
  const checkinByEvent = await getEventCheckinCounts(eventIds);

  let ticketsSold = 0;
  let totalCapacity = 0;
  let revenue = 0;
  let remainingCapacity = 0;
  let ratingSum = 0;
  let ratingCount = 0;

  const performance = events.map((event) => {
    const sold = event.ticketTypes.reduce((s, tt) => s + tt.soldCount, 0);
    const cap = event.capacity;
    const eventRevenue =
      sold > 0
        ? event.ticketTypes.reduce((s, tt) => s + tt.soldCount * toNumber(tt.price), 0)
        : sold * toNumber(event.ticketPrice);
    const checkedIn = checkinByEvent.get(event.id) ?? 0;

    ticketsSold += sold;
    totalCapacity += cap;
    revenue += eventRevenue;
    remainingCapacity += Math.max(0, cap - sold);

    if (event.reviewCount > 0 && event.averageRating != null) {
      ratingSum += Number(event.averageRating) * event.reviewCount;
      ratingCount += event.reviewCount;
    }

    return {
      id: event.id,
      title: event.title,
      slug: event.slug,
      status: event.status,
      startsAt: event.startsAt.toISOString(),
      sold,
      capacity: cap,
      checkedIn,
      revenue: eventRevenue,
      averageRating: event.averageRating != null ? Number(event.averageRating) : null,
      reviewCount: event.reviewCount,
    };
  });

  const revenueByEvent = performance
    .filter((e) => e.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8)
    .map((e) => ({ name: e.title.slice(0, 24), revenue: e.revenue, sold: e.sold }));

  const avgTicketPrice = ticketsSold > 0 ? revenue / ticketsSold : 0;
  const projectedRevenue = revenue + remainingCapacity * avgTicketPrice;

  const overview = {
    totalEvents: events.length,
    publishedEvents: events.filter((e) => e.status === "approved").length,
    ticketsSold,
    totalCapacity,
    revenue,
    checkIns: checkinSummary.checkedIn,
    pendingReviews: pendingReviewsCount,
    averageRating: ratingCount > 0 ? Math.round((ratingSum / ratingCount) * 10) / 10 : null,
    totalTransfers,
  };

  return {
    overview,
    salesByDay: groupSalesByDay(bookings, 30),
    revenueByEvent,
    performance,
    revenueSimulation: {
      actualRevenue: revenue,
      projectedRevenue: Math.round(projectedRevenue),
      remainingCapacity,
      sellThroughRate: totalCapacity > 0 ? Math.round((ticketsSold / totalCapacity) * 100) : 0,
    },
    checkinSummary: {
      totalTickets: checkinSummary.totalTickets,
      checkedIn: checkinSummary.checkedIn,
      remaining: Math.max(0, checkinSummary.totalTickets - checkinSummary.checkedIn),
      scanCounts: checkinSummary.scanCounts,
    },
    events: performance.map((e) => ({
      id: e.id,
      title: e.title,
      slug: e.slug,
      status: e.status,
      startsAt: e.startsAt,
      bannerUrl: events.find((ev) => ev.id === e.id)?.bannerUrl ?? null,
      sold: e.sold,
      capacity: e.capacity,
      revenue: e.revenue,
    })),
    transfers: transfers.map((t) => ({
      id: t.id,
      ticketCode: t.ticket.ticketCode,
      eventTitle: t.event.title,
      fromName: t.fromUser.fullName,
      toName: t.toUser.fullName,
      createdAt: t.createdAt.toISOString(),
    })),
    feedback: feedback.map((r) => ({
      id: r.id,
      eventTitle: r.event.title,
      rating: r.rating,
      comment: r.comment,
      status: r.status,
      authorName: r.user.fullName,
      createdAt: r.createdAt.toISOString(),
    })),
    pendingReviewsCount,
  };
}

export async function getEventAttendeesForOrganizer(args: {
  eventId: string;
  userId: string;
  role: UserRole;
}): Promise<{ ok: true; attendees: AttendeeRow[] } | { ok: false; code: string }> {
  if (args.role !== "admin") {
    const owned = await verifyOrganizerOwnsEvent(args.eventId, args.userId);
    if (!owned) return { ok: false, code: "FORBIDDEN" };
  } else {
    const { prisma } = await import("@/lib/db");
    const exists = await prisma.event.findUnique({
      where: { id: args.eventId },
      select: { id: true },
    });
    if (!exists) return { ok: false, code: "NOT_FOUND" };
  }

  const tickets = await listEventAttendees(args.eventId);
  return {
    ok: true,
    attendees: tickets.map((t) => ({
      ticketId: t.id,
      ticketCode: t.ticketCode,
      holderName: t.user.fullName,
      email: t.user.email,
      phone: t.user.phoneNumber,
      ticketType: t.ticketType.name,
      checkedIn: t.checkedInAt != null,
      checkedInAt: t.checkedInAt?.toISOString() ?? null,
    })),
  };
}
