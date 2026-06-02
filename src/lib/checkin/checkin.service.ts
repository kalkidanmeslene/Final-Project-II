import type { ScanResult, UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { canAccessEventCheckin, canManageEventStaff } from "./checkin.access";
import {
  addEventStaff,
  createScanLog,
  findEventForCheckin,
  findTicketForOwner,
  findTicketForScan,
  findUserByEmail,
  getCheckinAnalytics,
  listEventStaff,
  listScanHistory,
  removeEventStaff,
} from "./checkin.repository";
import type {
  CheckinAnalytics,
  EventStaffDto,
  ScanHistoryItem,
  ScanResponse,
  ScannedTicketInfo,
  TicketQrDto,
} from "./checkin.types";
import type { PurchasedTicketLine } from "./format-purchased-tickets";
import {
  checkinWindowEnd,
  isCheckinWindowOpen,
  signTicketQrToken,
  verifyTicketQrToken,
} from "./qr-token";

function scanMessage(result: ScanResult, extra?: string): string {
  switch (result) {
    case "valid":
      return "Ticket valid. Guest checked in.";
    case "already_used":
      return extra ?? "Ticket already checked in.";
    case "expired":
      return "Ticket or event check-in window has expired.";
    case "invalid":
      return extra ?? "Invalid ticket.";
    default:
      return "Scan processed.";
  }
}

async function logScan(args: {
  eventId: string;
  ticketId: string | null;
  scannedById: string;
  result: ScanResult;
  ticketCode?: string | null;
  detail?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  await createScanLog(args);
}

type TicketForScanInfo = NonNullable<Awaited<ReturnType<typeof findTicketForScan>>>;

function mapPurchasedTickets(
  lines: { quantity: number; ticketType: { name: string } }[],
): PurchasedTicketLine[] {
  return lines.map((l) => ({ ticketTypeName: l.ticketType.name, quantity: l.quantity }));
}

function toScannedTicketInfo(ticket: TicketForScanInfo, checkedInAt?: Date | string | null): ScannedTicketInfo {
  const checked =
    checkedInAt instanceof Date
      ? checkedInAt.toISOString()
      : typeof checkedInAt === "string"
        ? checkedInAt
        : ticket.checkedInAt?.toISOString() ?? null;

  return {
    id: ticket.id,
    ticketCode: ticket.ticketCode,
    ticketTypeName: ticket.ticketType.name,
    holderName: ticket.user.fullName,
    checkedInAt: checked,
    purchasedTickets: mapPurchasedTickets(ticket.booking.lines),
  };
}

export async function getTicketQrPayload(ticketId: string, userId: string): Promise<TicketQrDto | null> {
  const ticket = await findTicketForOwner(ticketId, userId);
  if (!ticket) return null;

  const expiresAt = checkinWindowEnd(ticket.event.endsAt);
  const payload = await signTicketQrToken(
    {
      ticketId: ticket.id,
      ticketCode: ticket.ticketCode,
      eventId: ticket.eventId,
      version: ticket.qrVersion,
    },
    expiresAt,
  );

  return {
    ticketId: ticket.id,
    ticketCode: ticket.ticketCode,
    payload,
    expiresAt: expiresAt.toISOString(),
  };
}

export async function processScan(args: {
  eventId: string;
  payload: string;
  scannerUserId: string;
  scannerRole: UserRole;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<
  | { ok: true; response: ScanResponse }
  | { ok: false; code: "FORBIDDEN" | "NOT_FOUND"; message: string }
> {
  const allowed = await canAccessEventCheckin(args.eventId, args.scannerUserId, args.scannerRole);
  if (!allowed) {
    return { ok: false, code: "FORBIDDEN", message: "You do not have check-in access for this event." };
  }

  const event = await findEventForCheckin(args.eventId);
  if (!event) {
    return { ok: false, code: "NOT_FOUND", message: "Event not found." };
  }

  const verified = await verifyTicketQrToken(args.payload);

  if (!verified.ok) {
    const result: ScanResult =
      verified.reason === "expired" ? "expired" : "invalid";
    await logScan({
      eventId: args.eventId,
      ticketId: null,
      scannedById: args.scannerUserId,
      result,
      detail: verified.reason,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
    });
    return {
      ok: true,
      response: {
        result,
        message: scanMessage(result),
        checkedIn: false,
      },
    };
  }

  const { claims } = verified;

  if (claims.eventId !== args.eventId) {
    await logScan({
      eventId: args.eventId,
      ticketId: null,
      scannedById: args.scannerUserId,
      result: "invalid",
      ticketCode: claims.ticketCode,
      detail: "wrong_event",
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
    });
    return {
      ok: true,
      response: {
        result: "invalid",
        message: "This ticket is not for this event.",
        checkedIn: false,
      },
    };
  }

  const ticket = await findTicketForScan(claims.ticketId);

  if (!ticket || ticket.ticketCode !== claims.ticketCode) {
    await logScan({
      eventId: args.eventId,
      ticketId: null,
      scannedById: args.scannerUserId,
      result: "invalid",
      ticketCode: claims.ticketCode,
      detail: "ticket_not_found",
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
    });
    return {
      ok: true,
      response: {
        result: "invalid",
        message: scanMessage("invalid"),
        checkedIn: false,
      },
    };
  }

  if (ticket.qrVersion !== claims.version) {
    await logScan({
      eventId: args.eventId,
      ticketId: ticket.id,
      scannedById: args.scannerUserId,
      result: "invalid",
      ticketCode: ticket.ticketCode,
      detail: "qr_version_mismatch",
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
    });
    return {
      ok: true,
      response: {
        result: "invalid",
        message: "QR code has been revoked. Ask the guest to refresh their ticket.",
        checkedIn: false,
        ticket: toScannedTicketInfo(ticket),
      },
    };
  }

  if (ticket.status !== "confirmed") {
    await logScan({
      eventId: args.eventId,
      ticketId: ticket.id,
      scannedById: args.scannerUserId,
      result: "invalid",
      ticketCode: ticket.ticketCode,
      detail: `status_${ticket.status}`,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
    });
    return {
      ok: true,
      response: {
        result: "invalid",
        message: `Ticket is ${ticket.status} and cannot be used.`,
        checkedIn: false,
        ticket: toScannedTicketInfo(ticket),
      },
    };
  }

  if (ticket.event.status === "cancelled") {
    await logScan({
      eventId: args.eventId,
      ticketId: ticket.id,
      scannedById: args.scannerUserId,
      result: "invalid",
      ticketCode: ticket.ticketCode,
      detail: "event_cancelled",
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
    });
    return {
      ok: true,
      response: {
        result: "invalid",
        message: "Event has been cancelled.",
        checkedIn: false,
        ticket: toScannedTicketInfo(ticket),
      },
    };
  }

  if (!isCheckinWindowOpen(ticket.event.endsAt)) {
    await logScan({
      eventId: args.eventId,
      ticketId: ticket.id,
      scannedById: args.scannerUserId,
      result: "expired",
      ticketCode: ticket.ticketCode,
      detail: "checkin_window_closed",
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
    });
    return {
      ok: true,
      response: {
        result: "expired",
        message: scanMessage("expired"),
        checkedIn: false,
        ticket: toScannedTicketInfo(ticket),
      },
    };
  }

  if (ticket.checkedInAt) {
    const at = ticket.checkedInAt.toISOString();
    await logScan({
      eventId: args.eventId,
      ticketId: ticket.id,
      scannedById: args.scannerUserId,
      result: "already_used",
      ticketCode: ticket.ticketCode,
      detail: `checked_in_at_${at}`,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
    });
    return {
      ok: true,
      response: {
        result: "already_used",
        message: scanMessage("already_used", `Already checked in at ${ticket.checkedInAt.toLocaleString()}.`),
        checkedIn: false,
        ticket: toScannedTicketInfo(ticket, at),
      },
    };
  }

  const checkedInAt = new Date();
  const updated = await prisma.$transaction(async (tx) => {
    const current = await tx.ticket.findUnique({
      where: { id: ticket.id },
      select: { checkedInAt: true },
    });
    if (current?.checkedInAt) {
      return { alreadyUsed: true as const, checkedInAt: current.checkedInAt };
    }

    const row = await tx.ticket.update({
      where: { id: ticket.id },
      data: {
        checkedInAt,
        checkedInById: args.scannerUserId,
      },
      select: { checkedInAt: true },
    });

    await tx.ticketScan.create({
      data: {
        eventId: args.eventId,
        ticketId: ticket.id,
        scannedById: args.scannerUserId,
        result: "valid",
        ticketCode: ticket.ticketCode,
        ipAddress: args.ipAddress,
        userAgent: args.userAgent,
      },
    });

    return { alreadyUsed: false as const, checkedInAt: row.checkedInAt! };
  });

  if (updated.alreadyUsed) {
    await logScan({
      eventId: args.eventId,
      ticketId: ticket.id,
      scannedById: args.scannerUserId,
      result: "already_used",
      ticketCode: ticket.ticketCode,
      detail: "race_already_used",
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
    });
    return {
      ok: true,
      response: {
        result: "already_used",
        message: scanMessage("already_used"),
        checkedIn: false,
        ticket: toScannedTicketInfo(ticket, updated.checkedInAt),
      },
    };
  }

  return {
    ok: true,
    response: {
      result: "valid",
      message: scanMessage("valid"),
      checkedIn: true,
      ticket: toScannedTicketInfo(ticket, updated.checkedInAt),
    },
  };
}

export async function getScanHistory(
  eventId: string,
  userId: string,
  role: UserRole,
  opts: { limit?: number; cursor?: string },
): Promise<ScanHistoryItem[] | null> {
  const allowed = await canAccessEventCheckin(eventId, userId, role);
  if (!allowed) return null;

  const rows = await listScanHistory(eventId, opts);
  return rows.map((r) => ({
    id: r.id,
    result: r.result,
    ticketCode: r.ticketCode ?? r.ticket?.ticketCode ?? null,
    detail: r.detail,
    scannedByName: r.scannedBy.fullName,
    createdAt: r.createdAt.toISOString(),
    ticketTypeName: r.ticket?.ticketType.name ?? null,
    holderName: r.ticket?.user.fullName ?? null,
    purchasedTickets: r.ticket ? mapPurchasedTickets(r.ticket.booking.lines) : [],
  }));
}

export async function getEventCheckinAnalytics(
  eventId: string,
  userId: string,
  role: UserRole,
): Promise<CheckinAnalytics | null> {
  const allowed = await canAccessEventCheckin(eventId, userId, role);
  if (!allowed) return null;
  return getCheckinAnalytics(eventId);
}

export async function getStaffList(
  eventId: string,
  userId: string,
  role: UserRole,
): Promise<EventStaffDto[] | null> {
  const allowed = await canManageEventStaff(eventId, userId, role);
  if (!allowed) return null;
  const rows = await listEventStaff(eventId);
  return rows.map((s) => ({
    id: s.id,
    userId: s.user.id,
    fullName: s.user.fullName,
    email: s.user.email,
    role: s.role,
    createdAt: s.createdAt.toISOString(),
  }));
}

export async function assignStaff(args: {
  eventId: string;
  managerUserId: string;
  managerRole: UserRole;
  email: string;
  role: "scanner" | "manager";
}): Promise<
  | { ok: true; staff: EventStaffDto }
  | { ok: false; code: string; message: string }
> {
  const allowed = await canManageEventStaff(args.eventId, args.managerUserId, args.managerRole);
  if (!allowed) {
    return { ok: false, code: "FORBIDDEN", message: "Only the event organizer can manage staff." };
  }

  const event = await findEventForCheckin(args.eventId);
  if (!event) return { ok: false, code: "NOT_FOUND", message: "Event not found." };

  const user = await findUserByEmail(args.email);
  if (!user || user.status !== "active") {
    return { ok: false, code: "USER_NOT_FOUND", message: "No active user with that email." };
  }

  if (user.id === event.organizerId) {
    return { ok: false, code: "INVALID_STAFF", message: "Organizer already has full access." };
  }

  try {
    const row = await addEventStaff({
      event: { connect: { id: args.eventId } },
      user: { connect: { id: user.id } },
      role: args.role,
      addedById: args.managerUserId,
    });
    return {
      ok: true,
      staff: {
        id: row.id,
        userId: row.user.id,
        fullName: row.user.fullName,
        email: row.user.email,
        role: row.role,
        createdAt: row.createdAt.toISOString(),
      },
    };
  } catch {
    return { ok: false, code: "ALREADY_STAFF", message: "User is already assigned to this event." };
  }
}

export async function unassignStaff(args: {
  eventId: string;
  staffId: string;
  managerUserId: string;
  managerRole: UserRole;
}): Promise<{ ok: boolean; code?: string; message?: string }> {
  const allowed = await canManageEventStaff(args.eventId, args.managerUserId, args.managerRole);
  if (!allowed) {
    return { ok: false, code: "FORBIDDEN", message: "Only the event organizer can manage staff." };
  }
  const result = await removeEventStaff(args.eventId, args.staffId);
  if (result.count === 0) {
    return { ok: false, code: "NOT_FOUND", message: "Staff assignment not found." };
  }
  return { ok: true };
}
