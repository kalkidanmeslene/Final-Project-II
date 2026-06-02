"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md" | "lg";
};

const sizes = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-7 w-7" };

export function StarRating({ value, onChange, readOnly, size = "md" }: Props) {
  return (
    <div className="flex items-center gap-0.5" role={readOnly ? "img" : "group"} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(star)}
          className={cn(
            "rounded p-0.5 transition-colors",
            readOnly ? "cursor-default" : "cursor-pointer hover:scale-110",
            star <= value ? "text-amber-500" : "text-muted-foreground/40",
          )}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
        >
          <Star className={cn(sizes[size], star <= value && "fill-current")} />
        </button>
      ))}
    </div>
  );
}

export function RatingDisplay({
  averageRating,
  reviewCount,
  size = "md",
}: {
  averageRating: number | null;
  reviewCount: number;
  size?: "sm" | "md";
}) {
  if (reviewCount === 0 || averageRating == null) {
    return <span className="text-sm text-muted-foreground">No reviews yet</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <StarRating value={Math.round(averageRating)} readOnly size={size === "sm" ? "sm" : "md"} />
      <span className="text-sm font-medium">{averageRating.toFixed(1)}</span>
      <span className="text-sm text-muted-foreground">({reviewCount})</span>
    </div>
  );
}
