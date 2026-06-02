import type { CalendarSystem } from "./calendar.types";

export const CALENDAR_COOKIE = "hibir_calendar";

export function isCalendarSystem(value: string | undefined | null): value is CalendarSystem {
  return value === "gregorian" || value === "ethiopian";
}

export function parseCalendarCookie(value: string | undefined | null): CalendarSystem {
  return isCalendarSystem(value) ? value : "gregorian";
}
