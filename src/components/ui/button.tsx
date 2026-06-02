import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
};

export function Button({
  className,
  variant = "default",
  size = "md",
  ...props
}: ButtonProps) {
  const resolvedVariant = variant === "default" ? "primary" : variant;

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        resolvedVariant === "primary" && "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        resolvedVariant === "secondary" && "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        resolvedVariant === "outline" &&
          "border-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground",
        resolvedVariant === "danger" && "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        resolvedVariant === "ghost" && "text-foreground hover:bg-secondary/50",
        size === "sm" && "px-3 py-1.5 text-sm",
        size === "md" && "px-6 py-3 text-base",
        size === "lg" && "px-8 py-4 text-lg",
        className,
      )}
      {...props}
    />
  );
}
