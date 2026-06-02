"use client";

import { useEffect, useState } from "react";
import { Calendar } from "lucide-react";
import { useTranslations } from "next-intl";
import type { CalendarSystem } from "@/lib/calendar/calendar.types";
import { useLocalePreferences } from "@/providers/locale-provider";
import { cn } from "@/lib/utils";

export function CalendarSwitcher({ className }: { className?: string }) {
  const t = useTranslations("calendar");
  const { calendar, setCalendar } = useLocalePreferences();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const active = mounted ? calendar : "gregorian";

  return (
    <div
      className={cn("flex items-center gap-1 rounded-lg border border-border bg-card p-1", className)}
      suppressHydrationWarning
    >
      <Calendar className="mx-1 h-4 w-4 text-muted-foreground" aria-hidden />
      {(["gregorian", "ethiopian"] as CalendarSystem[]).map((system) => (
        <button
          key={system}
          type="button"
          onClick={() => setCalendar(system)}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
            active === system
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-secondary",
          )}
        >
          {system === "gregorian" ? t("gregorian") : t("ethiopian")}
        </button>
      ))}
    </div>
  );
}
