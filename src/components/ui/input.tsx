import * as React from "react";
import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    const inputClass = cn(
      "w-full rounded-lg border border-input bg-input-background px-4 py-3 text-foreground transition-all placeholder:text-muted-foreground focus:border-transparent focus:ring-2 focus:ring-ring focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
      error && "border-destructive focus:ring-destructive",
      !label && "h-10 py-2 text-sm",
      className,
    );

    if (label) {
      return (
        <div className="w-full space-y-2">
          <label htmlFor={inputId} className="block text-sm font-semibold text-foreground">
            {label}
          </label>
          <input ref={ref} id={inputId} className={inputClass} {...props} />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      );
    }

    return <input ref={ref} id={inputId} className={inputClass} {...props} />;
  },
);

Input.displayName = "Input";
