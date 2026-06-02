import { cn } from "@/lib/utils";

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold",
        variant === "default" && "bg-secondary text-secondary-foreground",
        variant === "success" && "bg-success text-success-foreground",
        variant === "warning" && "bg-amber-500 text-white",
        variant === "danger" && "bg-destructive text-destructive-foreground",
        variant === "info" && "bg-primary text-primary-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}
