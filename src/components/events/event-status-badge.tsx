import type { EventStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

const STYLES: Record<EventStatus, string> = {
  draft: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
  completed: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
};

export function EventStatusBadge({ status }: { status: EventStatus }) {
  return (
    <span
      className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", STYLES[status])}
      aria-label={`Status: ${status}`}
    >
      {status}
    </span>
  );
}
