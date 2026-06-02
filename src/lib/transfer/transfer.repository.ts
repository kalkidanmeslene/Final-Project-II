import { prisma } from "@/lib/db";

export async function findTicketForTransfer(ticketId: string) {
  return prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      event: { select: { id: true, title: true, slug: true, transferEnabled: true, status: true, endsAt: true } },
      ticketType: { select: { name: true } },
      user: { select: { id: true, fullName: true, email: true } },
    },
  });
}

export async function findRecipientUser(identifier: { email?: string; phone?: string }) {
  if (identifier.email) {
    return prisma.user.findUnique({
      where: { email: identifier.email.trim().toLowerCase() },
      select: { id: true, fullName: true, email: true, phoneNumber: true, status: true, role: true },
    });
  }
  if (identifier.phone) {
    return prisma.user.findFirst({
      where: { phoneNumber: identifier.phone.trim() },
      select: { id: true, fullName: true, email: true, phoneNumber: true, status: true, role: true },
    });
  }
  return null;
}

export async function listTransfersForTicket(ticketId: string) {
  return prisma.ticketTransfer.findMany({
    where: { ticketId },
    orderBy: { createdAt: "desc" },
    include: {
      fromUser: { select: { id: true, fullName: true } },
      toUser: { select: { id: true, fullName: true } },
      event: { select: { title: true } },
      ticket: { select: { ticketCode: true } },
    },
  });
}

export async function listTransfersForUser(userId: string, limit = 50) {
  return prisma.ticketTransfer.findMany({
    where: { OR: [{ fromUserId: userId }, { toUserId: userId }] },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      fromUser: { select: { id: true, fullName: true } },
      toUser: { select: { id: true, fullName: true } },
      event: { select: { title: true } },
      ticket: { select: { ticketCode: true, id: true } },
    },
  });
}

export async function listAllTransfersAdmin(opts: { limit?: number; cursor?: string } = {}) {
  const take = opts.limit ?? 50;
  return prisma.ticketTransfer.findMany({
    take,
    ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
    include: {
      fromUser: { select: { id: true, fullName: true, email: true } },
      toUser: { select: { id: true, fullName: true, email: true } },
      event: { select: { id: true, title: true, slug: true } },
      ticket: { select: { ticketCode: true, id: true } },
    },
  });
}
