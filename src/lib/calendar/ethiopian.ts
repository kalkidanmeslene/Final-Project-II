import { toEthiopian } from "ethiopian-date";

export type EthiopianDateParts = {
  year: number;
  month: number;
  day: number;
};

const MONTHS_EN = [
  "Meskerem",
  "Tikimt",
  "Hidar",
  "Tahsas",
  "Tir",
  "Yekatit",
  "Megabit",
  "Miazia",
  "Genbot",
  "Sene",
  "Hamle",
  "Nehase",
  "Pagumen",
] as const;

const MONTHS_AM = [
  "መስከረም",
  "ጥቅምት",
  "ኅዳር",
  "ታኅሣሥ",
  "ጥር",
  "የካቲት",
  "መጋቢት",
  "ሚያዝያ",
  "ግንቦት",
  "ሰኔ",
  "ሐምሌ",
  "ነሐሴ",
  "ጳጉሜን",
] as const;

export function gregorianToEthiopian(date: Date): EthiopianDateParts {
  const [year, month, day] = toEthiopian([date.getFullYear(), date.getMonth() + 1, date.getDate()]);
  return { year, month, day };
}

export function getEthiopianMonthName(month: number, locale: "en" | "am"): string {
  if (month === 13) return locale === "am" ? MONTHS_AM[12]! : MONTHS_EN[12]!;
  const idx = month - 1;
  if (idx < 0 || idx > 11) return locale === "am" ? MONTHS_AM[0]! : MONTHS_EN[0]!;
  return locale === "am" ? MONTHS_AM[idx]! : MONTHS_EN[idx]!;
}

export function formatEthiopianDate(date: Date, locale: "en" | "am"): string {
  const { year, month, day } = gregorianToEthiopian(date);
  const monthName = getEthiopianMonthName(month, locale);
  if (locale === "am") {
    return `${monthName} ${day}፣ ${year} ዓ.ም.`;
  }
  return `${monthName} ${day}, ${year} E.C.`;
}
