"use client";

import * as React from "react";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

type PasswordInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    const inputClass = cn(
      "w-full rounded-lg border border-input bg-input-background px-4 py-3 pr-11 text-foreground transition-all placeholder:text-muted-foreground focus:border-transparent focus:ring-2 focus:ring-ring focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
      error && "border-destructive focus:ring-destructive",
      !label && "h-10 py-2 text-sm",
      className,
    );

    const field = (
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type={visible ? "text" : "password"}
          className={inputClass}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );

    if (label) {
      return (
        <div className="w-full space-y-2">
          <label htmlFor={inputId} className="block text-sm font-semibold text-foreground">
            {label}
          </label>
          {field}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      );
    }

    return field;
  },
);

PasswordInput.displayName = "PasswordInput";
