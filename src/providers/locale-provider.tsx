"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocale } from "next-intl";
import type { CalendarSystem } from "@/lib/calendar/calendar.types";
import { CALENDAR_COOKIE, parseCalendarCookie } from "@/lib/calendar/preferences";
import type { AppLocale } from "@/i18n/routing";

type LocaleContextValue = {
  locale: AppLocale;
  calendar: CalendarSystem;
  setCalendar: (system: CalendarSystem) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function readCalendarCookie(): CalendarSystem {
  if (typeof document === "undefined") return "gregorian";
  const match = document.cookie.match(new RegExp(`(?:^|; )${CALENDAR_COOKIE}=([^;]*)`));
  return parseCalendarCookie(match?.[1] ? decodeURIComponent(match[1]) : null);
}

function writeCalendarCookie(system: CalendarSystem) {
  document.cookie = `${CALENDAR_COOKIE}=${system}; path=/; max-age=31536000; SameSite=Lax`;
}

export function LocalePreferencesProvider({ children }: { children: ReactNode }) {
  const locale = useLocale() as AppLocale;
  const [calendar, setCalendarState] = useState<CalendarSystem>("gregorian");

  useEffect(() => {
    setCalendarState(readCalendarCookie());
  }, []);

  const setCalendar = useCallback((system: CalendarSystem) => {
    setCalendarState(system);
    writeCalendarCookie(system);
  }, []);

  const value = useMemo(
    () => ({
      locale,
      calendar,
      setCalendar,
    }),
    [locale, calendar, setCalendar],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocalePreferences() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocalePreferences must be used within LocalePreferencesProvider");
  }
  return ctx;
}
