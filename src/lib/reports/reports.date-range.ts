export function parseReportDateRange(args: { from?: string; to?: string; days?: number }) {
  const days = args.days ?? 30;
  const to = args.to ? new Date(args.to) : new Date();
  const from = args.from ? new Date(args.from) : new Date(to.getTime() - days * 24 * 60 * 60 * 1000);

  to.setHours(23, 59, 59, 999);
  from.setHours(0, 0, 0, 0);

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
    throw new Error("INVALID_RANGE");
  }

  const spanDays = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)) + 1);

  return {
    from,
    to,
    days: spanDays,
    fromIso: from.toISOString(),
    toIso: to.toISOString(),
  };
}

export function buildDateKeys(from: Date, to: Date): string[] {
  const keys: string[] = [];
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);
  while (cursor <= end) {
    keys.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }
  return keys;
}

export function initDailyMap<T>(keys: string[], factory: () => T): Map<string, T> {
  const map = new Map<string, T>();
  for (const key of keys) map.set(key, factory());
  return map;
}
