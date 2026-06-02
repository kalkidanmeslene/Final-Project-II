export type CalendarSystem = "gregorian" | "ethiopian";

export type AppLocale = "en" | "am";

export type FormatDateOptions = {
  locale: AppLocale;
  calendar: CalendarSystem;
  includeTime?: boolean;
  dateStyle?: "full" | "long" | "medium" | "short";
};
