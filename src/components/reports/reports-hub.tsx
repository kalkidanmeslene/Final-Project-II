"use client";

import { useMemo, useState } from "react";
import { Download, FileText, RefreshCw } from "lucide-react";
import type { ReportsDashboardData, ReportScope } from "@/lib/reports/reports.types";
import { downloadReportExport, useAdminReports, useOrganizerReports } from "@/hooks/use-reports";
import { DashboardStatCard } from "@/components/organizer-dashboard/dashboard-stat-card";
import { AdminDataTable } from "@/components/admin-dashboard/admin-data-table";
import { RevenueSimulationChart } from "@/components/organizer-dashboard/dashboard-charts";
import {
  AttendanceChart,
  TicketSalesChart,
  TransferChart,
  UserGrowthChart,
  ValidationChart,
} from "./report-charts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { formatCurrency } from "@/lib/format";
import {
  DollarSign,
  Ticket,
  UserCheck,
  ArrowLeftRight,
  Users,
  TrendingUp,
} from "lucide-react";

type Props = {
  scope: ReportScope;
  initial?: ReportsDashboardData;
};

export function ReportsHub({ scope, initial }: Props) {
  const [days, setDays] = useState(initial?.range.days ?? 30);
  const [from, setFrom] = useState(initial?.range.from.slice(0, 10) ?? "");
  const [to, setTo] = useState(initial?.range.to.slice(0, 10) ?? "");

  const query = useMemo(
    () => ({
      days: from && to ? undefined : days,
      from: from || undefined,
      to: to || undefined,
    }),
    [days, from, to],
  );

  const adminQuery = useAdminReports(query, scope === "admin" ? initial : undefined);
  const organizerQuery = useOrganizerReports(query, scope === "organizer" ? initial : undefined);
  const { data, isLoading, isFetching, refetch } = scope === "admin" ? adminQuery : organizerQuery;
  const report = data ?? initial;

  if (!report && isLoading) return <Spinner label="Loading reports" />;

  if (!report) return <p className="text-sm text-muted-foreground">Unable to load reports.</p>;

  const s = report.summary;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <Label htmlFor="report-days">Period (days)</Label>
            <Input
              id="report-days"
              type="number"
              min={7}
              max={365}
              className="mt-1 w-24"
              value={days}
              onChange={(e) => setDays(Number(e.target.value) || 30)}
              disabled={!!from && !!to}
            />
          </div>
          <div>
            <Label htmlFor="report-from">From</Label>
            <Input id="report-from" type="date" className="mt-1" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="report-to">To</Label>
            <Input id="report-to" type="date" className="mt-1" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <Button variant="outline" size="sm" className="mb-0.5" onClick={() => void refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-1 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => downloadReportExport(scope, { ...query, format: "csv" })}>
            <Download className="mr-1 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => downloadReportExport(scope, { ...query, format: "pdf" })}>
            <FileText className="mr-1 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {report.range.from.slice(0, 10)} → {report.range.to.slice(0, 10)} ({report.range.days} days)
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <DashboardStatCard label="Revenue" value={formatCurrency(s.revenue)} icon={DollarSign} />
        <DashboardStatCard label="Tickets sold" value={s.ticketsSold.toLocaleString()} icon={Ticket} />
        <DashboardStatCard label="Bookings" value={s.bookings.toLocaleString()} icon={TrendingUp} />
        <DashboardStatCard
          label="Check-ins"
          value={s.checkIns.toLocaleString()}
          icon={UserCheck}
          hint={`${s.attendanceRate}% attendance rate`}
        />
        <DashboardStatCard label="Transfers" value={s.transfers.toLocaleString()} icon={ArrowLeftRight} />
        {scope === "admin" && (
          <DashboardStatCard label="New users" value={s.newUsers.toLocaleString()} icon={Users} />
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 font-semibold">Ticket sales</h3>
          <TicketSalesChart data={report.ticketSales} />
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 font-semibold">Attendance</h3>
          <AttendanceChart data={report.attendance} />
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 font-semibold">Validation activity</h3>
          <ValidationChart data={report.validationActivity} />
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 font-semibold">Transfer statistics</h3>
          <TransferChart data={report.transferStats} />
        </div>
        {scope === "admin" && (
          <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
            <h3 className="mb-3 font-semibold">User growth</h3>
            <UserGrowthChart data={report.userGrowth} />
          </div>
        )}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 font-semibold">Revenue simulation</h3>
          <p className="mb-2 text-xs text-muted-foreground">
            Sell-through {report.revenueSimulation.sellThroughRate}% · {report.revenueSimulation.remainingCapacity}{" "}
            seats remaining
          </p>
          <RevenueSimulationChart
            actual={report.revenueSimulation.actualRevenue}
            projected={report.revenueSimulation.projectedRevenue}
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-4 font-semibold">Event popularity</h3>
        <AdminDataTable
          columns={[
            { key: "title", label: "Event" },
            { key: "org", label: scope === "admin" ? "Organizer" : "Sold" },
            { key: "sold", label: "Tickets" },
            { key: "rev", label: "Revenue" },
            { key: "in", label: "Check-ins" },
          ]}
          rows={report.eventPopularity.slice(0, 20).map((e) => ({
            id: e.eventId,
            cells: [
              e.title,
              scope === "admin" ? e.organizerName : String(e.ticketsSold),
              String(e.ticketsSold),
              formatCurrency(e.revenue),
              String(e.checkIns),
            ],
          }))}
        />
      </div>

      {scope === "admin" && report.organizerPerformance.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 font-semibold">Organizer performance</h3>
          <AdminDataTable
            columns={[
              { key: "name", label: "Organizer" },
              { key: "events", label: "Events" },
              { key: "sold", label: "Tickets" },
              { key: "rev", label: "Revenue" },
              { key: "in", label: "Check-ins" },
            ]}
            rows={report.organizerPerformance.map((o) => ({
              id: o.organizerId,
              cells: [
                o.organizerName,
                String(o.eventsCount),
                String(o.ticketsSold),
                formatCurrency(o.revenue),
                String(o.checkIns),
              ],
            }))}
          />
        </div>
      )}
    </div>
  );
}
