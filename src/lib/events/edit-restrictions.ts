import { env } from "@/lib/env";

export type ScheduleFields = {
  location?: string;
  venue?: string;
  startsAt?: Date | string;
  endsAt?: Date | string;
};

export function isScheduleLocked(startsAt: Date): boolean {
  const lockMs = env.EVENT_EDIT_LOCK_DAYS * 24 * 60 * 60 * 1000;
  return startsAt.getTime() - Date.now() < lockMs;
}

export function assertScheduleEditable(
  currentStartsAt: Date,
  updates: ScheduleFields,
): { ok: true } | { ok: false; message: string } {
  if (!isScheduleLocked(currentStartsAt)) return { ok: true };

  const changing =
    (updates.location !== undefined && updates.location !== null) ||
    (updates.venue !== undefined && updates.venue !== null) ||
    updates.startsAt !== undefined ||
    updates.endsAt !== undefined;

  if (changing) {
    return {
      ok: false,
      message: `Location and schedule cannot be changed within ${env.EVENT_EDIT_LOCK_DAYS} days of the event start.`,
    };
  }

  return { ok: true };
}
