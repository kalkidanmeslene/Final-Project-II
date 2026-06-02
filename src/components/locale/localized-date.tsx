"use client";

import { useLocalizedFormat } from "@/hooks/use-localized-format";

export function LocalizedDate({
  value,
  includeTime = false,
  className,
}: {
  value: string | Date;
  includeTime?: boolean;
  className?: string;
}) {
  const { formatDate } = useLocalizedFormat();
  return (
    <time dateTime={typeof value === "string" ? value : value.toISOString()} className={className}>
      {formatDate(value, { includeTime })}
    </time>
  );
}
