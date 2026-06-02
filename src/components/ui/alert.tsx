import * as React from "react";
import { cn } from "@/lib/utils";

export function Alert({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "destructive" | "success" }) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-md border px-4 py-3 text-sm",
        variant === "default" && "border-border bg-secondary text-foreground",
        variant === "success" &&
          "border-success/40 bg-success/15 text-[#1e6b34] dark:text-[#9ae6b0]",
        variant === "destructive" &&
          "border-destructive/30 bg-destructive/10 text-destructive",
        className,
      )}
      {...props}
    />
  );
}
