"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  placeholder?: string;
  size?: "default" | "hero";
};

export function EventSearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = "Search events, organizers, or locations...",
  size = "default",
}: Props) {
  const isHero = size === "hero";

  return (
    <form onSubmit={onSubmit} className={isHero ? "mx-auto mt-8 max-w-3xl" : "w-full"}>
      <div className="relative">
        <Search
          className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground ${isHero ? "left-4 h-6 w-6" : "left-3 h-5 w-5"}`}
        />
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={
            isHero
              ? "w-full rounded-xl bg-card py-5 pr-36 pl-14 text-lg text-foreground shadow-lg focus:ring-2 focus:ring-accent focus:outline-none"
              : "w-full rounded-lg border border-border bg-card py-3 pr-24 pl-10 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
          }
          aria-label="Search events"
        />
        <Button
          type="submit"
          className={isHero ? "absolute top-1/2 right-2 -translate-y-1/2" : "absolute top-1/2 right-1.5 -translate-y-1/2"}
          size={isHero ? "md" : "sm"}
        >
          Search
        </Button>
      </div>
    </form>
  );
}
