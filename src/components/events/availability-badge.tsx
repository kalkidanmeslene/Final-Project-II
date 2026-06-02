"use client";

import { useEventAvailability } from "@/hooks/use-events";
import { Spinner } from "@/components/ui/spinner";

export function AvailabilityBadge({ slug, fallback }: { slug: string; fallback?: { available: number; capacity: number } }) {
  const { data, isLoading } = useEventAvailability(slug, !!slug);

  const availability = data?.availability ?? fallback;

  if (isLoading && !availability) {
    return <Spinner label="Loading availability" />;
  }

  if (!availability) return null;

  const low = availability.available <= Math.max(5, Math.floor(availability.capacity * 0.1));

  return (
    <p
      className={`text-sm font-medium ${low ? "text-amber-700 dark:text-amber-300" : "text-emerald-700 dark:text-emerald-300"}`}
      aria-live="polite"
      aria-atomic="true"
    >
      {availability.available} of {availability.capacity} tickets left
      {low && " · Selling fast"}
    </p>
  );
}
