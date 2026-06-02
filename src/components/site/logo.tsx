import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2", className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
        <span className="text-2xl font-bold text-primary-foreground">H</span>
      </div>
      <span className="text-2xl font-bold text-foreground">Hibir Events</span>
    </Link>
  );
}
