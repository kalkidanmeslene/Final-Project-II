import { prisma } from "@/lib/db";
import { auditLog } from "@/lib/audit/audit.service";
import { notifyUser } from "@/lib/notifications/notification.service";
import type {
  BulkTransferTicketResult,
  TransferEligibility,
  TicketTransferDto,
  TransferTicketResult,
} from "./transfer.types";
import {
  findRecipientUser,
  findTicketForTransfer,
  listAllTransfersAdmin,
  listTransfersForTicket,
  listTransfersForUser,
} from "./transfer.repository";

type TicketWithEvent = NonNullable<Awaited<ReturnType<typeof findTicketForTransfer>>>;

export function evaluateTransferEligibilityFields(args: {
  ownerUserId: string;
  ticketUserId: string;
  status: string;
  checkedInAt: Date | null;
  transferEnabled: boolean;
  eventStatus: string;
  endsAt: Date;
}): TransferEligibility {
  if (args.ticketUserId !== args.ownerUserId) {
    return { canTransfer: false, reason: "You do not own this ticket." };
  }
  if (args.status !== "confirmed") {
    return { canTransfer: false, reason: "Only confirmed tickets can be transferred." };
  }
  if (args.checkedInAt) {
    return { canTransfer: false, reason: "Used tickets cannot be transferred." };
  }
  if (!args.transferEnabled) {
    return { canTransfer: false, reason: "Transfers are disabled for this event." };
  }
  if (args.eventStatus === "cancelled") {
    return { canTransfer: false, reason: "This event was cancelled." };
  }
  if (args.endsAt < new Date()) {
    return { canTransfer: false, reason: "This event has already ended." };
  }
  return { canTransfer: true };
}

export function evaluateTransferEligibility(
  ticket: TicketWithEvent,
  ownerUserId: string,
): TransferEligibility {
  return evaluateTransferEligibilityFields({
    ownerUserId,
    ticketUserId: ticket.userId,
    status: ticket.status,
    checkedInAt: ticket.checkedInAt,
    transferEnabled: ticket.event.transferEnabled,
    eventStatus: ticket.event.status,
    endsAt: ticket.event.endsAt,
  });
}

function toTransferDto(row: {
  id: string;
  ticketId: string;
  eventId: string;
  fromUserId: string;
  toUserId: string;
  createdAt: Date;
  ticket: { ticketCode: string };
  event: { title: string };
  fromUser: { fullName: string };
  toUser: { fullName: string };
}): TicketTransferDto {
  return {
    id: row.id,
    ticketId: row.ticketId,
    ticketCode: row.ticket.ticketCode,
    eventId: row.eventId,
    eventTitle: row.event.title,
    fromUserId: row.fromUserId,
    fromUserName: row.fromUser.fullName,
    toUserId: row.toUserId,
    toUserName: row.toUser.fullName,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getTicketTransferEligibility(ticketId: string, ownerUserId: string) {
  const ticket = await findTicketForTransfer(ticketId);
  if (!ticket) return { ok: false as const, code: "NOT_FOUND" as const };
  return { ok: true as const, eligibility: evaluateTransferEligibility(ticket, ownerUserId) };
}

type TransferRecipient = NonNullable<Awaited<ReturnType<typeof findRecipientUser>>>;

async function resolveTransferRecipient(args: {
  fromUserId: string;
  recipientEmail?: string;
  recipientPhone?: string;
}): Promise<{ ok: true; recipient: TransferRecipient } | { ok: false; code: string; message: string }> {
  const recipient = await findRecipientUser({
    email: args.recipientEmail,
    phone: args.recipientPhone,
  });

  if (!recipient) {
    return {
      ok: false,
      code: "RECIPIENT_NOT_FOUND",
      message: "No registered user found with that email or phone.",
    };
  }

  if (recipient.status !== "active") {
    return { ok: false, code: "RECIPIENT_INACTIVE", message: "Recipient account is not active." };
  }

  if (recipient.id === args.fromUserId) {
    return { ok: false, code: "SELF_TRANSFER", message: "You cannot transfer a ticket to yourself." };
  }

  return { ok: true, recipient };
}

/** Recipients may already hold tickets for the same event — multiple tickets per person are allowed. */
async function transferTicketToRecipient(args: {
  ticketId: string;
  fromUserId: string;
  recipient: TransferRecipient;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<
  | { ok: true; data: TransferTicketResult }
  | { ok: false; code: string; message: string; ticketCode?: string }
> {
  const ticket = await findTicketForTransfer(args.ticketId);
  if (!ticket) {
    return { ok: false, code: "NOT_FOUND", message: "Ticket not found." };
  }

  const eligibility = evaluateTransferEligibility(ticket, args.fromUserId);
  if (!eligibility.canTransfer) {
    return {
      ok: false,
      code: "TRANSFER_NOT_ALLOWED",
      message: eligibility.reason ?? "Transfer not allowed.",
      ticketCode: ticket.ticketCode,
    };
  }

  const recipient = args.recipient;
  const qrVersionBefore = ticket.qrVersion;
  const qrVersionAfter = qrVersionBefore + 1;

  const result = await prisma.$transaction(async (tx) => {
    const current = await tx.ticket.findUnique({
      where: { id: ticket.id },
      select: { userId: true, checkedInAt: true, status: true, qrVersion: true },
    });

    if (!current || current.userId !== args.fromUserId) {
      throw new Error("OWNERSHIP_CHANGED");
    }
    if (current.checkedInAt || current.status !== "confirmed") {
      throw new Error("TICKET_USED");
    }

    const updated = await tx.ticket.update({
      where: { id: ticket.id },
      data: {
        userId: recipient.id,
        qrVersion: qrVersionAfter,
      },
      select: { id: true, ticketCode: true, qrVersion: true },
    });

    const transfer = await tx.ticketTransfer.create({
      data: {
        ticketId: ticket.id,
        eventId: ticket.eventId,
        fromUserId: args.fromUserId,
        toUserId: recipient.id,
        ticketCodeSnapshot: ticket.ticketCode,
        qrVersionBefore,
        qrVersionAfter,
      },
      include: {
        fromUser: { select: { fullName: true } },
        toUser: { select: { fullName: true } },
        event: { select: { title: true } },
        ticket: { select: { ticketCode: true } },
      },
    });

    return { updated, transfer };
  });

  const transferDto = toTransferDto(result.transfer);

  await auditLog({
    userId: args.fromUserId,
    action: "ticket_transferred",
    success: true,
    ipAddress: args.ipAddress,
    userAgent: args.userAgent,
    metadata: {
      ticketId: ticket.id,
      ticketCode: ticket.ticketCode,
      eventId: ticket.eventId,
      fromUserId: args.fromUserId,
      toUserId: recipient.id,
      transferId: result.transfer.id,
      qrVersionBefore,
      qrVersionAfter,
    },
  });

  const eventTitle = ticket.event.title;

  await notifyUser({
    userId: args.fromUserId,
    type: "ticket_transferred",
    title: "Ticket transferred",
    body: `Your ticket ${ticket.ticketCode} for "${eventTitle}" was sent to ${recipient.fullName}.`,
    eventId: ticket.eventId,
    metadata: { ticketId: ticket.id, transferId: result.transfer.id, toUserId: recipient.id },
  });

  await notifyUser({
    userId: recipient.id,
    type: "ticket_received",
    title: "Ticket received",
    body: `${ticket.user.fullName} transferred ticket ${ticket.ticketCode} for "${eventTitle}" to you.`,
    eventId: ticket.eventId,
    metadata: { ticketId: ticket.id, transferId: result.transfer.id, fromUserId: args.fromUserId },
  });

  return {
    ok: true,
    data: {
      transfer: transferDto,
      ticket: {
        id: result.updated.id,
        ticketCode: result.updated.ticketCode,
        newOwnerId: recipient.id,
        qrVersion: result.updated.qrVersion,
      },
    },
  };
}

export async function transferTicket(args: {
  ticketId: string;
  fromUserId: string;
  recipientEmail?: string;
  recipientPhone?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<
  | { ok: true; data: TransferTicketResult }
  | { ok: false; code: string; message: string }
> {
  const resolved = await resolveTransferRecipient(args);
  if (!resolved.ok) return resolved;

  const result = await transferTicketToRecipient({
    ticketId: args.ticketId,
    fromUserId: args.fromUserId,
    recipient: resolved.recipient,
    ipAddress: args.ipAddress,
    userAgent: args.userAgent,
  });

  if (!result.ok) {
    return { ok: false, code: result.code, message: result.message };
  }
  return result;
}

export async function transferTickets(args: {
  ticketIds: string[];
  fromUserId: string;
  recipientEmail?: string;
  recipientPhone?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<
  | { ok: true; data: BulkTransferTicketResult }
  | { ok: false; code: string; message: string }
> {
  const uniqueIds = [...new Set(args.ticketIds)];
  if (uniqueIds.length === 0) {
    return { ok: false, code: "NO_TICKETS", message: "Select at least one ticket to transfer." };
  }

  const resolved = await resolveTransferRecipient(args);
  if (!resolved.ok) return resolved;

  const transfers: TransferTicketResult[] = [];
  const failures: BulkTransferTicketResult["failures"] = [];

  for (const ticketId of uniqueIds) {
    const result = await transferTicketToRecipient({
      ticketId,
      fromUserId: args.fromUserId,
      recipient: resolved.recipient,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
    });

    if (result.ok) {
      transfers.push(result.data);
    } else {
      failures.push({
        ticketId,
        ticketCode: result.ticketCode,
        message: result.message,
      });
    }
  }

  if (transfers.length === 0) {
    return {
      ok: false,
      code: failures[0]?.ticketId ? "TRANSFER_FAILED" : "TRANSFER_FAILED",
      message: failures[0]?.message ?? "No tickets could be transferred.",
    };
  }

  return {
    ok: true,
    data: {
      transferredCount: transfers.length,
      recipientName: resolved.recipient.fullName,
      recipientId: resolved.recipient.id,
      transfers,
      failures,
    },
  };
}

export async function getTicketTransferHistory(ticketId: string, userId: string, role: string) {
  const ticket = await findTicketForTransfer(ticketId);
  if (!ticket) return null;

  const isOwner = ticket.userId === userId;
  const wasOwner = await prisma.ticketTransfer.findFirst({
    where: { ticketId, OR: [{ fromUserId: userId }, { toUserId: userId }] },
    select: { id: true },
  });

  if (!isOwner && !wasOwner && role !== "admin") return null;

  const rows = await listTransfersForTicket(ticketId);
  return rows.map(toTransferDto);
}

export async function getMyTransferHistory(userId: string) {
  const rows = await listTransfersForUser(userId);
  return rows.map(toTransferDto);
}

export async function getAdminTransferHistory(opts: { limit?: number; cursor?: string }) {
  const rows = await listAllTransfersAdmin(opts);
  return rows.map((r) => ({
    ...toTransferDto(r),
    fromUserEmail: r.fromUser.email,
    toUserEmail: r.toUser.email,
    eventSlug: r.event.slug,
  }));
}
