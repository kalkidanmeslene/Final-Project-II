import { formatEventDate } from "@/lib/events/format";
import type { EventScheduleEmail } from "./notification.types";

type EventScheduleFields = {
  startsAt: Date;
  endsAt: Date;
  venue: string;
  location: string;
};

export function buildEventScheduleEmailContext(
  before: EventScheduleFields,
  after: EventScheduleFields,
  options?: { reason?: string; includePrevious?: boolean },
): EventScheduleEmail {
  const scheduleChanged = before.startsAt.getTime() !== after.startsAt.getTime();
  const venueChanged = before.venue !== after.venue;
  const locationChanged = before.location !== after.location;

  return {
    dateTime: formatEventDate(after.startsAt.toISOString()),
    venue: after.venue,
    location: after.location,
    previousDateTime:
      options?.includePrevious !== false && scheduleChanged
        ? formatEventDate(before.startsAt.toISOString())
        : undefined,
    previousVenue: venueChanged ? before.venue : undefined,
    previousLocation: locationChanged ? before.location : undefined,
    reason: options?.reason,
  };
}

export function describeEventUpdateChanges(
  before: EventScheduleFields,
  after: EventScheduleFields,
  updates: {
    eventDate?: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    venue?: string;
  },
): string {
  const lines: string[] = [];

  if (
    (updates.eventDate || updates.startTime || updates.endTime) &&
    before.startsAt.getTime() !== after.startsAt.getTime()
  ) {
    lines.push(
      `Date & time: ${formatEventDate(before.startsAt.toISOString())} → ${formatEventDate(after.startsAt.toISOString())}`,
    );
  }
  if (updates.venue && before.venue !== after.venue) {
    lines.push(`Venue: ${before.venue} → ${after.venue}`);
  }
  if (updates.location && before.location !== after.location) {
    lines.push(`Location: ${before.location} → ${after.location}`);
  }

  if (lines.length === 0) {
    return `"${after.venue ? `${after.venue}, ` : ""}${after.location}" — please review the event page for full details.`;
  }

  return lines.join("\n");
}
