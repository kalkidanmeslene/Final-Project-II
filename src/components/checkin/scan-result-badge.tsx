import type { ScanResult } from "@prisma/client";
import { clsx } from "clsx";

const STYLES: Record<ScanResult, string> = {
  valid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  already_used: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  expired: "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200",
  invalid: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
};

const LABELS: Record<ScanResult, string> = {
  valid: "Valid",
  already_used: "Already used",
  expired: "Expired",
  invalid: "Invalid",
};

export function ScanResultBadge({ result }: { result: ScanResult }) {
  return (
    <span className={clsx("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", STYLES[result])}>
      {LABELS[result]}
    </span>
  );
}
