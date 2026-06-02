"use client";

import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EventSortOption } from "@/lib/discovery/discovery.types";

export type EventFilterState = {
  category: string;
  priceFilter: "all" | "free" | "paid";
  dateFrom: string;
  dateTo: string;
  priceMin: string;
  priceMax: string;
  sort: EventSortOption;
};

type Category = { slug: string; name: string };

type Props = {
  filters: EventFilterState;
  categories: Category[];
  onChange: (patch: Partial<EventFilterState>) => void;
  onClear: () => void;
};

export function EventFiltersPanel({ filters, categories, onChange, onClear }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Filter className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Filters</h3>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-muted-foreground">Sort by</h4>
        <select
          value={filters.sort}
          onChange={(e) => onChange({ sort: e.target.value as EventSortOption })}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="date">Date (soonest)</option>
          <option value="popularity">Popularity</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </select>
      </div>

      <div className="mt-6 space-y-3">
        <h4 className="text-sm font-semibold text-muted-foreground">Category</h4>
        <div className="space-y-2">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="category"
              checked={filters.category === "all"}
              onChange={() => onChange({ category: "all" })}
              className="h-4 w-4 text-primary"
            />
            <span className="text-sm">All categories</span>
          </label>
          {categories.map((cat) => (
            <label key={cat.slug} className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="category"
                checked={filters.category === cat.slug}
                onChange={() => onChange({ category: cat.slug })}
                className="h-4 w-4 text-primary"
              />
              <span className="text-sm">{cat.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <h4 className="text-sm font-semibold text-muted-foreground">Date</h4>
        <div className="space-y-2">
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => onChange({ dateFrom: e.target.value })}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            aria-label="From date"
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => onChange({ dateTo: e.target.value })}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            aria-label="To date"
          />
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <h4 className="text-sm font-semibold text-muted-foreground">Price</h4>
        <div className="space-y-2">
          {[
            { value: "all" as const, label: "All events" },
            { value: "free" as const, label: "Free only" },
            { value: "paid" as const, label: "Paid only" },
          ].map((opt) => (
            <label key={opt.value} className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="price"
                checked={filters.priceFilter === opt.value}
                onChange={() => onChange({ priceFilter: opt.value })}
                className="h-4 w-4 text-primary"
              />
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 pt-2">
          <input
            type="number"
            min="0"
            placeholder="Min ETB"
            value={filters.priceMin}
            onChange={(e) => onChange({ priceMin: e.target.value })}
            className="rounded-lg border border-border bg-background px-2 py-2 text-sm"
          />
          <input
            type="number"
            min="0"
            placeholder="Max ETB"
            value={filters.priceMax}
            onChange={(e) => onChange({ priceMax: e.target.value })}
            className="rounded-lg border border-border bg-background px-2 py-2 text-sm"
          />
        </div>
      </div>

      <Button variant="ghost" className="mt-6 w-full" type="button" onClick={onClear}>
        Clear filters
      </Button>
    </div>
  );
}
