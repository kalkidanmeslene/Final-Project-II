import { randomUUID } from "crypto";
import type { UserRole } from "@prisma/client";
import { assertScheduleEditable } from "./edit-restrictions";
import { countSoldTickets, toEventDetail, toEventListItem } from "./event.mapper";
import { parseEventDateTime, validateEventReadyForSubmission } from "./event.schemas";
import { zodFieldErrors } from "@/lib/http/zod-error";
import {
  addEventMedia,
  countTicketsSold,
  createEvent,
  deleteEvent,
  findCategories,
  findEventById,
  findEventBySlug,
  listOrganizerEvents,
  listPendingEvents,
  listPublicEvents,
  removeEventMedia,
  setEventStatus,
  slugExists,
  updateEvent,
} from "./event.repository";
import { withUniqueSlug } from "./slug";
import { deleteEventMediaFile, saveEventMediaFile } from "./media-upload";
import {
  buildEventScheduleEmailContext,
  describeEventUpdateChanges,
} from "@/lib/notifications/event-schedule-email";
import { notifyAdmins, notifyEventAttendees, notifyUser, cancelEventReminders, rescheduleEventReminders, scheduleEventReminders } from "@/lib/notifications/notification.service";

function canManageEvent(role: UserRole, userId: string, organizerId: string) {
  return role === "admin" || userId === organizerId;
}

const DRAFT_DEFAULTS = {
  title: "Untitled draft",
  description: "Draft — add a full description before submitting for approval.",
  location: "TBD",
  venue: "TBD",
  startTime: "10:00",
  endTime: "12:00",
} as const;

function defaultDraftEventDate() {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  d.setMonth(5);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

async function resolveDraftCreateFields(args: {
  title?: string;
  description?: string;
  categoryId?: string;
  location?: string;
  venue?: string;
  eventDate?: string;
  startTime?: string;
  endTime?: string;
  ticketPrice?: number;
  capacity?: number;
  visibility?: "public" | "private" | "unlisted";
  transferEnabled?: boolean;
  isFeatured?: boolean;
}) {
  const categories = await findCategories();
  const defaultCategoryId = categories[0]?.id;
  if (!defaultCategoryId) {
    return {
      ok: false as const,
      code: "NO_CATEGORIES" as const,
      message: "No event categories are configured. Contact support.",
    };
  }

  return {
    ok: true as const,
    title: args.title?.trim() || DRAFT_DEFAULTS.title,
    description: args.description?.trim() || DRAFT_DEFAULTS.description,
    categoryId: args.categoryId ?? defaultCategoryId,
    location: args.location?.trim() || DRAFT_DEFAULTS.location,
    venue: args.venue?.trim() || DRAFT_DEFAULTS.venue,
    eventDate: args.eventDate ?? defaultDraftEventDate(),
    startTime: args.startTime ?? DRAFT_DEFAULTS.startTime,
    endTime: args.endTime ?? DRAFT_DEFAULTS.endTime,
    ticketPrice: args.ticketPrice ?? 0,
    capacity: args.capacity ?? 100,
    visibility: args.visibility ?? "public",
    transferEnabled: args.transferEnabled ?? true,
    isFeatured: args.isFeatured ?? false,
  };
}

export async function getCategories() {
  return findCategories();
}

export async function getPublicEvents(filters?: {
  categorySlug?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const { events, total } = await listPublicEvents(filters);
  return {
    events: events.map((e) => toEventListItem(e, countSoldTickets(e))),
    total,
  };
}

export async function getEventBySlug(slug: string, viewer?: { userId?: string; role?: UserRole }) {
  const event = await findEventBySlug(slug);
  if (!event) return null;

  const sold = countSoldTickets(event);

  if (event.status === "approved") {
    if (event.visibility === "private") {
      if (!viewer?.userId || !canManageEvent(viewer.role ?? "attendee", viewer.userId, event.organizerId)) {
        return null;
      }
    }
    return toEventDetail(event, sold);
  }

  if (viewer?.userId && canManageEvent(viewer.role ?? "attendee", viewer.userId, event.organizerId)) {
    return toEventDetail(event, sold);
  }

  return null;
}

export async function getEventAvailability(slug: string) {
  const event = await findEventBySlug(slug);
  if (!event || event.status !== "approved") return null;
  const sold = await countTicketsSold(event.id);
  return {
    eventId: event.id,
    slug: event.slug,
    capacity: event.capacity,
    sold,
    available: Math.max(0, event.capacity - sold),
    updatedAt: new Date().toISOString(),
  };
}

export async function getOrganizerEvents(organizerId: string) {
  const events = await listOrganizerEvents(organizerId);
  return events.map((e) => toEventListItem(e, countSoldTickets(e)));
}

export async function createOrganizerEvent(args: {
  organizerId: string;
  title?: string;
  description?: string;
  categoryId?: string;
  location?: string;
  venue?: string;
  eventDate?: string;
  startTime?: string;
  endTime?: string;
  ticketPrice?: number;
  capacity?: number;
  visibility?: "public" | "private" | "unlisted";
  transferEnabled?: boolean;
  isFeatured?: boolean;
  saveAsDraft: boolean;
}) {
  const fields = args.saveAsDraft
    ? await resolveDraftCreateFields(args)
    : {
        ok: true as const,
        title: args.title!,
        description: args.description!,
        categoryId: args.categoryId!,
        location: args.location!,
        venue: args.venue!,
        eventDate: args.eventDate!,
        startTime: args.startTime!,
        endTime: args.endTime!,
        ticketPrice: args.ticketPrice!,
        capacity: args.capacity!,
        visibility: args.visibility ?? "public",
        transferEnabled: args.transferEnabled ?? true,
        isFeatured: args.isFeatured ?? false,
      };

  if (!fields.ok) return fields;

  const { startsAt, endsAt } = parseEventDateTime(fields.eventDate, fields.startTime, fields.endTime);
  if (!args.saveAsDraft && startsAt.getTime() <= Date.now()) {
    return { ok: false as const, code: "INVALID_DATE" as const, message: "Event must be scheduled in the future." };
  }

  const slug = withUniqueSlug(fields.title, randomUUID());
  if (await slugExists(slug)) {
    return { ok: false as const, code: "SLUG_CONFLICT" as const, message: "Could not generate unique slug." };
  }

  const status = args.saveAsDraft ? ("draft" as const) : ("pending" as const);

  const event = await createEvent({
    title: fields.title,
    slug,
    description: fields.description,
    location: fields.location,
    venue: fields.venue,
    startsAt,
    endsAt,
    ticketPrice: fields.ticketPrice,
    capacity: fields.capacity,
    visibility: fields.visibility,
    transferEnabled: fields.transferEnabled,
    isFeatured: fields.isFeatured,
    status,
    organizer: { connect: { id: args.organizerId } },
    category: { connect: { id: fields.categoryId } },
  });

  if (status === "pending") {
    await notifyAdmins({
      type: "event_submitted",
      title: "New event pending approval",
      body: `"${event.title}" was submitted for review.`,
      eventId: event.id,
      metadata: { slug: event.slug },
    });
    await notifyUser({
      userId: args.organizerId,
      type: "event_submitted",
      title: "Event submitted",
      body: `"${event.title}" is pending admin approval.`,
      eventId: event.id,
    });
  }

  return { ok: true as const, event: toEventDetail(event, 0) };
}

export async function updateOrganizerEvent(args: {
  eventId: string;
  userId: string;
  role: UserRole;
  updates: {
    title?: string;
    description?: string;
    categoryId?: string;
    location?: string;
    venue?: string;
    eventDate?: string;
    startTime?: string;
    endTime?: string;
    ticketPrice?: number;
    capacity?: number;
    visibility?: "public" | "private" | "unlisted";
    transferEnabled?: boolean;
    isFeatured?: boolean;
  };
}) {
  const event = await findEventById(args.eventId);
  if (!event) return { ok: false as const, code: "NOT_FOUND" as const };
  if (!canManageEvent(args.role, args.userId, event.organizerId)) {
    return { ok: false as const, code: "FORBIDDEN" as const };
  }
  if (["cancelled", "completed"].includes(event.status)) {
    return { ok: false as const, code: "INVALID_STATUS" as const, message: "Cannot edit a cancelled or completed event." };
  }

  let startsAt = event.startsAt;
  let endsAt = event.endsAt;

  if (args.updates.eventDate && args.updates.startTime && args.updates.endTime) {
    const parsed = parseEventDateTime(args.updates.eventDate, args.updates.startTime, args.updates.endTime);
    startsAt = parsed.startsAt;
    endsAt = parsed.endsAt;
  }

  const lockCheck = assertScheduleEditable(event.startsAt, {
    location: args.updates.location,
    venue: args.updates.venue,
    startsAt,
    endsAt,
  });
  if (!lockCheck.ok) {
    return { ok: false as const, code: "SCHEDULE_LOCKED" as const, message: lockCheck.message };
  }

  const sold = countSoldTickets(event);
  if (args.updates.capacity !== undefined && args.updates.capacity < sold) {
    return {
      ok: false as const,
      code: "CAPACITY_TOO_LOW" as const,
      message: `Capacity cannot be less than tickets already sold (${sold}).`,
    };
  }

  const updated = await updateEvent(args.eventId, {
    ...(args.updates.title && { title: args.updates.title }),
    ...(args.updates.description && { description: args.updates.description }),
    ...(args.updates.categoryId && { category: { connect: { id: args.updates.categoryId } } }),
    ...(args.updates.location && { location: args.updates.location }),
    ...(args.updates.venue && { venue: args.updates.venue }),
    startsAt,
    endsAt,
    ...(args.updates.ticketPrice !== undefined && { ticketPrice: args.updates.ticketPrice }),
    ...(args.updates.capacity !== undefined && { capacity: args.updates.capacity }),
    ...(args.updates.visibility && { visibility: args.updates.visibility }),
    ...(args.updates.transferEnabled !== undefined && { transferEnabled: args.updates.transferEnabled }),
    ...(args.updates.isFeatured !== undefined && { isFeatured: args.updates.isFeatured }),
  });

  await notifyUser({
    userId: event.organizerId,
    type: "event_updated",
    title: "Event updated",
    body: `"${updated.title}" was updated.`,
    eventId: updated.id,
    eventTitle: updated.title,
    eventSlug: updated.slug,
  });

  if (updated.status === "approved") {
    const beforeSchedule = {
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      venue: event.venue,
      location: event.location,
    };
    const afterSchedule = {
      startsAt: updated.startsAt,
      endsAt: updated.endsAt,
      venue: updated.venue,
      location: updated.location,
    };
    await notifyEventAttendees({
      eventId: updated.id,
      type: "event_updated",
      title: "Event updated",
      body: describeEventUpdateChanges(beforeSchedule, afterSchedule, args.updates),
      excludeUserId: event.organizerId,
      eventTitle: updated.title,
      eventSlug: updated.slug,
      emailContextExtra: {
        eventSchedule: buildEventScheduleEmailContext(beforeSchedule, afterSchedule),
      },
    });
  }

  return { ok: true as const, event: toEventDetail(updated, countSoldTickets(updated)) };
}

export async function postponeEvent(args: {
  eventId: string;
  userId: string;
  role: UserRole;
  eventDate: string;
  startTime: string;
  endTime: string;
  reason: string;
}) {
  const event = await findEventById(args.eventId);
  if (!event) return { ok: false as const, code: "NOT_FOUND" as const };
  if (!canManageEvent(args.role, args.userId, event.organizerId)) {
    return { ok: false as const, code: "FORBIDDEN" as const };
  }
  if (event.status !== "approved") {
    return { ok: false as const, code: "INVALID_STATUS" as const, message: "Only approved events can be postponed." };
  }

  const { startsAt, endsAt } = parseEventDateTime(args.eventDate, args.startTime, args.endTime);

  const updated = await updateEvent(args.eventId, {
    startsAt,
    endsAt,
    postponedAt: new Date(),
    postponeReason: args.reason,
    originalStartsAt: event.originalStartsAt ?? event.startsAt,
  });

  await notifyUser({
    userId: event.organizerId,
    type: "event_postponed",
    title: "Event postponed",
    body: `"${updated.title}" has been rescheduled. Reason: ${args.reason}`,
    eventId: updated.id,
    eventTitle: updated.title,
    eventSlug: updated.slug,
  });

  const beforeSchedule = {
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    venue: event.venue,
    location: event.location,
  };
  const afterSchedule = {
    startsAt: updated.startsAt,
    endsAt: updated.endsAt,
    venue: updated.venue,
    location: updated.location,
  };

  await notifyEventAttendees({
    eventId: updated.id,
    type: "event_postponed",
    title: "Event rescheduled",
    body: `"${updated.title}" has a new date and time.\n\nReason: ${args.reason}`,
    excludeUserId: event.organizerId,
    eventTitle: updated.title,
    eventSlug: updated.slug,
    emailContextExtra: {
      eventSchedule: buildEventScheduleEmailContext(beforeSchedule, afterSchedule, {
        reason: args.reason,
      }),
    },
  });

  await rescheduleEventReminders({ eventId: updated.id, startsAt: updated.startsAt });

  return { ok: true as const, event: toEventDetail(updated, countSoldTickets(updated)) };
}

export async function deleteOrganizerEvent(args: { eventId: string; userId: string; role: UserRole }) {
  const event = await findEventById(args.eventId);
  if (!event) return { ok: false as const, code: "NOT_FOUND" as const };
  if (!canManageEvent(args.role, args.userId, event.organizerId)) {
    return { ok: false as const, code: "FORBIDDEN" as const };
  }

  const sold = await countTicketsSold(args.eventId);
  if (sold > 0) {
    return {
      ok: false as const,
      code: "TICKETS_SOLD" as const,
      message: "Cannot delete an event with sold tickets.",
    };
  }

  await deleteEvent(args.eventId);
  return { ok: true as const };
}

export async function submitEventForApproval(args: { eventId: string; userId: string; role: UserRole }) {
  const event = await findEventById(args.eventId);
  if (!event) return { ok: false as const, code: "NOT_FOUND" as const };
  if (!canManageEvent(args.role, args.userId, event.organizerId)) {
    return { ok: false as const, code: "FORBIDDEN" as const };
  }
  if (event.status !== "draft") {
    return { ok: false as const, code: "INVALID_STATUS" as const, message: "Only draft events can be submitted." };
  }

  const readiness = validateEventReadyForSubmission(event);
  if (!readiness.ok) {
    if (readiness.issues) {
      return {
        ok: false as const,
        code: "INCOMPLETE_DRAFT" as const,
        message: "Complete all required fields before submitting for approval.",
        fieldErrors: zodFieldErrors(readiness.issues),
      };
    }
    return {
      ok: false as const,
      code: "INCOMPLETE_DRAFT" as const,
      message: readiness.message,
      fieldErrors: readiness.field ? { [readiness.field]: [readiness.message] } : undefined,
    };
  }

  const updated = await setEventStatus(args.eventId, "pending");
  await notifyAdmins({
    type: "event_submitted",
    title: "Event submitted for approval",
    body: `"${updated.title}" is awaiting review.`,
    eventId: updated.id,
  });

  return { ok: true as const, event: toEventDetail(updated, countSoldTickets(updated)) };
}

export async function uploadEventBanner(args: { eventId: string; userId: string; role: UserRole; file: File }) {
  const event = await findEventById(args.eventId);
  if (!event) return { ok: false as const, code: "NOT_FOUND" as const };
  if (!canManageEvent(args.role, args.userId, event.organizerId)) {
    return { ok: false as const, code: "FORBIDDEN" as const };
  }

  const url = await saveEventMediaFile(args.eventId, args.file, "banner");
  if (event.bannerUrl) await deleteEventMediaFile(event.bannerUrl);
  const updated = await updateEvent(args.eventId, { bannerUrl: url });
  return { ok: true as const, event: toEventDetail(updated, countSoldTickets(updated)) };
}

export async function uploadGalleryMedia(args: {
  eventId: string;
  userId: string;
  role: UserRole;
  file: File;
  sortOrder?: number;
}) {
  const event = await findEventById(args.eventId);
  if (!event) return { ok: false as const, code: "NOT_FOUND" as const };
  if (!canManageEvent(args.role, args.userId, event.organizerId)) {
    return { ok: false as const, code: "FORBIDDEN" as const };
  }

  const url = await saveEventMediaFile(args.eventId, args.file, "gallery");
  const order = args.sortOrder ?? (event.media?.length ?? 0);
  await addEventMedia(args.eventId, url, order);
  const refreshed = await findEventById(args.eventId);
  return { ok: true as const, event: toEventDetail(refreshed!, countSoldTickets(refreshed!)) };
}

export async function deleteGalleryMedia(args: {
  eventId: string;
  mediaId: string;
  userId: string;
  role: UserRole;
}) {
  const event = await findEventById(args.eventId);
  if (!event) return { ok: false as const, code: "NOT_FOUND" as const };
  if (!canManageEvent(args.role, args.userId, event.organizerId)) {
    return { ok: false as const, code: "FORBIDDEN" as const };
  }

  const media = event.media?.find((m) => m.id === args.mediaId);
  if (media) await deleteEventMediaFile(media.url);
  await removeEventMedia(args.mediaId, args.eventId);
  const refreshed = await findEventById(args.eventId);
  return { ok: true as const, event: toEventDetail(refreshed!, countSoldTickets(refreshed!)) };
}

export async function adminApproveEvent(args: { eventId: string; adminId: string; note?: string | null }) {
  const event = await findEventById(args.eventId);
  if (!event || event.status !== "pending") {
    return { ok: false as const, code: "INVALID_STATUS" as const };
  }

  const updated = await setEventStatus(args.eventId, "approved", {
    reviewedBy: args.adminId,
    reviewNote: args.note ?? null,
    reviewedAt: new Date(),
  });

  await notifyUser({
    userId: event.organizerId,
    type: "event_approved",
    title: "Event approved",
    body: `"${updated.title}" is now live.`,
    eventId: updated.id,
  });

  return { ok: true as const, event: toEventDetail(updated, countSoldTickets(updated)) };
}

export async function adminRejectEvent(args: { eventId: string; adminId: string; note?: string | null }) {
  const event = await findEventById(args.eventId);
  if (!event || event.status !== "pending") {
    return { ok: false as const, code: "INVALID_STATUS" as const };
  }

  const updated = await setEventStatus(args.eventId, "draft", {
    reviewedBy: args.adminId,
    reviewNote: args.note ?? null,
    reviewedAt: new Date(),
  });

  await notifyUser({
    userId: event.organizerId,
    type: "event_rejected",
    title: "Event rejected",
    body: args.note ? `"${updated.title}" was rejected: ${args.note}` : `"${updated.title}" was rejected.`,
    eventId: updated.id,
  });

  return { ok: true as const, event: toEventDetail(updated, countSoldTickets(updated)) };
}

export async function getPendingEventsForAdmin() {
  const events = await listPendingEvents();
  return events.map((e) => toEventListItem(e, countSoldTickets(e)));
}

export async function cancelEvent(args: {
  eventId: string;
  userId: string;
  role: UserRole;
  reason?: string;
}) {
  const event = await findEventById(args.eventId);
  if (!event) return { ok: false as const, code: "NOT_FOUND" as const };
  if (!canManageEvent(args.role, args.userId, event.organizerId)) {
    return { ok: false as const, code: "FORBIDDEN" as const };
  }

  const reasonText = args.reason?.trim();
  const reasonSuffix = reasonText ? ` Reason: ${reasonText}` : "";

  const updated = await setEventStatus(args.eventId, "cancelled");
  await notifyUser({
    userId: event.organizerId,
    type: "event_cancelled",
    title: "Event cancelled",
    body: `"${updated.title}" has been cancelled.${reasonSuffix}`,
    eventId: updated.id,
    eventTitle: updated.title,
    eventSlug: updated.slug,
  });

  await notifyEventAttendees({
    eventId: updated.id,
    type: "event_cancelled",
    title: "Event cancelled",
    body: `"${updated.title}" has been cancelled by the organizer.${reasonSuffix}`,
    excludeUserId: event.organizerId,
    eventTitle: updated.title,
    eventSlug: updated.slug,
  });

  await cancelEventReminders(updated.id);

  return { ok: true as const, event: toEventDetail(updated, countSoldTickets(updated)) };
}
