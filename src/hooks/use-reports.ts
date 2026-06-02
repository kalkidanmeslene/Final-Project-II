"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api/fetch-json";
import type { ReportsDashboardData } from "@/lib/reports/reports.types";

export type ReportsQuery = {
  from?: string;
  to?: string;
  days?: number;
};

function buildQs(params: ReportsQuery) {
  const qs = new URLSearchParams();
  if (params.from) qs.set("from", params.from);
  if (params.to) qs.set("to", params.to);
  if (params.days) qs.set("days", String(params.days));
  return qs.toString();
}

export const reportsKeys = {
  admin: (params: ReportsQuery) => ["reports", "admin", params] as const,
  organizer: (params: ReportsQuery) => ["reports", "organizer", params] as const,
};

export function useAdminReports(params: ReportsQuery, initial?: ReportsDashboardData) {
  const qs = buildQs(params);
  return useQuery({
    queryKey: reportsKeys.admin(params),
    queryFn: () => fetchJson<ReportsDashboardData>(`/api/admin/reports?${qs}`),
    initialData: initial,
    staleTime: 60_000,
  });
}

export function useOrganizerReports(params: ReportsQuery, initial?: ReportsDashboardData) {
  const qs = buildQs(params);
  return useQuery({
    queryKey: reportsKeys.organizer(params),
    queryFn: () => fetchJson<ReportsDashboardData>(`/api/organizer/reports?${qs}`),
    initialData: initial,
    staleTime: 60_000,
  });
}

export function downloadReportExport(
  scope: "admin" | "organizer",
  params: ReportsQuery & { type?: string; format?: "csv" | "pdf" },
) {
  const qs = new URLSearchParams();
  if (params.from) qs.set("from", params.from);
  if (params.to) qs.set("to", params.to);
  if (params.days) qs.set("days", String(params.days));
  qs.set("type", params.type ?? "full");
  qs.set("format", params.format ?? "csv");

  const base = scope === "admin" ? "/api/admin/reports/export" : "/api/organizer/reports/export";
  window.open(`${base}?${qs.toString()}`, "_blank", "noopener,noreferrer");
}
