import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function canAccessEventCheckin(
  eventId: string,
  userId: string,
  role: UserRole,
): Promise<boolean> {
  if (role === "admin") return true;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { organizerId: true },
  });
  if (!event) return false;
  if (event.organizerId === userId) return true;

  const staff = await prisma.eventStaff.findUnique({
    where: { eventId_userId: { eventId, userId } },
    select: { id: true },
  });
  return !!staff;
}

export async function canManageEventStaff(
  eventId: string,
  userId: string,
  role: UserRole,
): Promise<boolean> {
  if (role === "admin") return true;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { organizerId: true },
  });
  return event?.organizerId === userId;
}
