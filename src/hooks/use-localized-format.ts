"use client";

import { useCallback } from "react";
import { useLocalePreferences } from "@/providers/locale-provider";
import { formatLocalizedDate, formatLocalizedDateTime, formatLocalizedTime } from "@/lib/calendar/format";

export function useLocalizedFormat() {
  const { locale, calendar } = useLocalePreferences();

  const formatDate = useCallback(
    (input: Date | string, options?: { includeTime?: boolean }) =>
      formatLocalizedDate(input, {
        locale,
        calendar,
        includeTime: options?.includeTime,
      }),
    [locale, calendar],
  );

  const formatDateTime = useCallback(
    (input: Date | string) => formatLocalizedDateTime(input, { locale, calendar }),
    [locale, calendar],
  );

  const formatTime = useCallback((input: Date | string) => formatLocalizedTime(input, locale), [locale]);

  return { locale, calendar, formatDate, formatDateTime, formatTime };
}
