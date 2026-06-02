"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function AdminDataTable({
  columns,
  rows,
  loading,
  emptyMessage = "No records found.",
  footer,
}: {
  columns: { key: string; label: string; className?: string }[];
  rows: { id: string; cells: React.ReactNode[] }[];
  loading?: boolean;
  emptyMessage?: string;
  footer?: React.ReactNode;
}) {
  if (loading) return <Spinner label="Loading" />;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border bg-secondary/50">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={`px-4 py-3 font-medium text-muted-foreground ${col.className ?? ""}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                  {row.cells.map((cell, i) => (
                    <td key={i} className="px-4 py-3 align-middle">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {footer}
    </div>
  );
}

export function TablePagination({
  offset,
  limit,
  total,
  hasMore,
  onPrev,
  onNext,
}: {
  offset: number;
  limit: number;
  total: number;
  hasMore: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + limit, total);

  return (
    <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
      <span>
        {from}–{to} of {total}
      </span>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={onPrev} disabled={offset === 0}>
          Previous
        </Button>
        <Button size="sm" variant="outline" onClick={onNext} disabled={!hasMore}>
          Next
        </Button>
      </div>
    </div>
  );
}
