import { z } from "zod";
import { toDateInputValue, toTimeInputValue } from "./format";

export const eventStatusSchema = z.enum(["draft", "pending", "approved", "cancelled", "completed"]);
export const eventVisibilitySchema = z.enum(["public", "private", "unlisted"]);

const baseEventFields = {
  title: z.string().min(3, "Title must be at least 3 characters.").max(200),
  description: z.string().min(10, "Description must be at least 10 characters.").max(10000),
  categoryId: z.string().uuid("Invalid category."),
  location: z.string().min(2, "Location is required.").max(200),
  venue: z.string().min(2, "Venue is required.").max(200),
  eventDate: z.string().min(1, "Event date is required."),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Start time must be HH:MM."),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "End time must be HH:MM."),
  ticketPrice: z.coerce.number().min(0, "Price cannot be negative."),
  capacity: z.coerce.number().int().min(1, "Capacity must be at least 1.").max(100000),
  visibility: eventVisibilitySchema.default("public"),
  transferEnabled: z.coerce.boolean().optional().default(true),
  isFeatured: z.coerce.boolean().optional(),
};

function combineDateTime(date: string, time: string): Date {
  const iso = `${date}T${time}:00`;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) throw new Error("Invalid date or time.");
  return d;
}

function emptyToUndefined(value: unknown) {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
}

function coerceOptionalNumber(value: unknown, fallback: number) {
  if (value === "" || value === null || value === undefined) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** Minimal validation when saving a new event as draft (incomplete form allowed). */
export const draftCreateEventSchema = z.object({
  title: z.preprocess(emptyToUndefined, z.string().max(200).optional()),
  description: z.preprocess(emptyToUndefined, z.string().max(10000).optional()),
  categoryId: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
  location: z.preprocess(emptyToUndefined, z.string().max(200).optional()),
  venue: z.preprocess(emptyToUndefined, z.string().max(200).optional()),
  eventDate: z.preprocess(emptyToUndefined, z.string().optional()),
  startTime: z.preprocess(emptyToUndefined, z.string().optional()),
  endTime: z.preprocess(emptyToUndefined, z.string().optional()),
  ticketPrice: z.preprocess((v) => coerceOptionalNumber(v, 0), z.number().min(0)),
  capacity: z.preprocess((v) => coerceOptionalNumber(v, 100), z.number().int().min(1).max(100000)),
  visibility: eventVisibilitySchema.optional().default("public"),
  transferEnabled: z.coerce.boolean().optional().default(true),
  isFeatured: z.coerce.boolean().optional(),
  saveAsDraft: z.literal(true),
});

export const draftUpdateEventSchema = z.object({
  title: z.preprocess(emptyToUndefined, z.string().max(200).optional()),
  description: z.preprocess(emptyToUndefined, z.string().max(10000).optional()),
  categoryId: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
  location: z.preprocess(emptyToUndefined, z.string().max(200).optional()),
  venue: z.preprocess(emptyToUndefined, z.string().max(200).optional()),
  eventDate: z.preprocess(emptyToUndefined, z.string().optional()),
  startTime: z.preprocess(emptyToUndefined, z.string().optional()),
  endTime: z.preprocess(emptyToUndefined, z.string().optional()),
  ticketPrice: z.preprocess((v) => (v === undefined ? undefined : coerceOptionalNumber(v, 0)), z.number().min(0).optional()),
  capacity: z.preprocess(
    (v) => (v === undefined ? undefined : coerceOptionalNumber(v, 100)),
    z.number().int().min(1).max(100000).optional(),
  ),
  visibility: eventVisibilitySchema.optional(),
  transferEnabled: z.coerce.boolean().optional(),
  isFeatured: z.coerce.boolean().optional(),
  saveAsDraft: z.literal(true).optional(),
});

export const createEventSchema = z
  .object({
    ...baseEventFields,
    saveAsDraft: z.boolean().optional().default(false),
  })
  .superRefine((val, ctx) => {
    try {
      const startsAt = combineDateTime(val.eventDate, val.startTime);
      const endsAt = combineDateTime(val.eventDate, val.endTime);
      if (endsAt <= startsAt) {
        ctx.addIssue({ code: "custom", message: "End time must be after start time.", path: ["endTime"] });
      }
    } catch {
      ctx.addIssue({ code: "custom", message: "Invalid event date or time.", path: ["eventDate"] });
    }
  });

export const updateEventSchema = z
  .object({
    title: baseEventFields.title.optional(),
    description: baseEventFields.description.optional(),
    categoryId: baseEventFields.categoryId.optional(),
    location: baseEventFields.location.optional(),
    venue: baseEventFields.venue.optional(),
    eventDate: z.string().optional(),
    startTime: baseEventFields.startTime.optional(),
    endTime: baseEventFields.endTime.optional(),
    ticketPrice: baseEventFields.ticketPrice.optional(),
    capacity: baseEventFields.capacity.optional(),
    visibility: eventVisibilitySchema.optional(),
    transferEnabled: z.coerce.boolean().optional(),
    isFeatured: z.coerce.boolean().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.eventDate || val.startTime || val.endTime) {
      if (!val.eventDate || !val.startTime || !val.endTime) {
        ctx.addIssue({
          code: "custom",
          message: "Provide event date, start time, and end time together.",
          path: ["eventDate"],
        });
      }
    }
  });

export const postponeEventSchema = z
  .object({
    eventDate: z.string().min(1),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    reason: z.string().min(3, "Please provide a reason.").max(500),
  })
  .superRefine((val, ctx) => {
    try {
      const startsAt = combineDateTime(val.eventDate, val.startTime);
      const endsAt = combineDateTime(val.eventDate, val.endTime);
      if (endsAt <= startsAt) {
        ctx.addIssue({ code: "custom", message: "End time must be after start time.", path: ["endTime"] });
      }
      if (startsAt.getTime() <= Date.now()) {
        ctx.addIssue({ code: "custom", message: "New date must be in the future.", path: ["eventDate"] });
      }
    } catch {
      ctx.addIssue({ code: "custom", message: "Invalid date or time.", path: ["eventDate"] });
    }
  });

export const cancelEventSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const adminReviewSchema = z.object({
  note: z.string().max(500).optional(),
});

export function parseEventDateTime(eventDate: string, startTime: string, endTime: string) {
  const startsAt = combineDateTime(eventDate, startTime);
  const endsAt = combineDateTime(eventDate, endTime);
  if (endsAt <= startsAt) throw new Error("End time must be after start time.");
  return { startsAt, endsAt };
}

export type EventSubmitSource = {
  title: string;
  description: string;
  categoryId: string;
  location: string;
  venue: string;
  startsAt: Date;
  endsAt: Date;
  ticketPrice: number | { toString(): string };
  capacity: number;
  visibility: string;
  transferEnabled: boolean;
};

export function eventToSubmitPayload(event: EventSubmitSource) {
  const startsIso = event.startsAt.toISOString();
  const endsIso = event.endsAt.toISOString();
  return {
    title: event.title,
    description: event.description,
    categoryId: event.categoryId,
    location: event.location,
    venue: event.venue,
    eventDate: toDateInputValue(startsIso),
    startTime: toTimeInputValue(startsIso),
    endTime: toTimeInputValue(endsIso),
    ticketPrice: Number(event.ticketPrice),
    capacity: event.capacity,
    visibility: event.visibility,
    transferEnabled: event.transferEnabled,
    saveAsDraft: false as const,
  };
}

export function validateEventReadyForSubmission(event: EventSubmitSource) {
  const parsed = createEventSchema.safeParse(eventToSubmitPayload(event));
  if (!parsed.success) {
    return { ok: false as const, issues: parsed.error };
  }
  try {
    const { startsAt } = parseEventDateTime(parsed.data.eventDate, parsed.data.startTime, parsed.data.endTime);
    if (startsAt.getTime() <= Date.now()) {
      return {
        ok: false as const,
        issues: null,
        message: "Event must be scheduled in the future.",
        field: "eventDate" as const,
      };
    }
  } catch {
    return { ok: false as const, issues: null, message: "Invalid event date or time.", field: "eventDate" as const };
  }
  return { ok: true as const };
}
