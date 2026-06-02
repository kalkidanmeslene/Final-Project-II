import type { ReportsDashboardData, ReportScope } from "./reports.types";
import {
  getAttendanceSeries,
  getEventPopularityRows,
  getOrganizerPerformanceRows,
  getReportSummary,
  getRevenueSimulation,
  getTicketSalesSeries,
  getTransferStatsSeries,
  getUserGrowthSeries,
  getValidationActivitySeries,
  parseReportDateRange,
} from "./reports.repository";

export async function buildReportsDashboard(
  scope: ReportScope,
  organizerId: string | undefined,
  query: { from?: string; to?: string; days?: number },
): Promise<ReportsDashboardData> {
  const range = parseReportDateRange(query);
  const orgFilter = scope === "organizer" ? organizerId : undefined;

  const [
    ticketSales,
    attendance,
    eventPopularity,
    validationActivity,
    transferStats,
    revenueSimulation,
  ] = await Promise.all([
    getTicketSalesSeries(orgFilter, range),
    getAttendanceSeries(orgFilter, range),
    getEventPopularityRows(orgFilter, range),
    getValidationActivitySeries(orgFilter, range),
    getTransferStatsSeries(orgFilter, range),
    getRevenueSimulation(orgFilter),
  ]);

  const userGrowth = scope === "admin" ? await getUserGrowthSeries(range) : [];
  const organizerPerformance = scope === "admin" ? await getOrganizerPerformanceRows(range) : [];

  const summary = await getReportSummary(orgFilter, range, {
    ticketSales,
    attendance,
    transferStats,
    userGrowth,
  });

  return {
    scope,
    range: { from: range.fromIso, to: range.toIso, days: range.days },
    summary,
    ticketSales,
    attendance,
    eventPopularity,
    organizerPerformance,
    revenueSimulation,
    validationActivity,
    userGrowth,
    transferStats,
  };
}
