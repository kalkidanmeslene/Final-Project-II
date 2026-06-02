"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  AttendancePoint,
  TicketSalesPoint,
  TransferStatsPoint,
  UserGrowthPoint,
  ValidationActivityPoint,
} from "@/lib/reports/reports.types";
import { formatCurrency } from "@/lib/format";

function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">{message}</div>
  );
}

export function TicketSalesChart({ data }: { data: TicketSalesPoint[] }) {
  if (data.every((d) => d.revenue === 0 && d.tickets === 0)) {
    return <ChartEmpty message="No ticket sales in this period" />;
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => String(v).slice(5)} />
        <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
        <Tooltip formatter={(v, name) => (name === "revenue" ? formatCurrency(Number(v ?? 0)) : String(v ?? 0))} />
        <Legend />
        <Line yAxisId="left" type="monotone" dataKey="revenue" name="Revenue" stroke="#2563eb" strokeWidth={2} dot={false} />
        <Line yAxisId="right" type="monotone" dataKey="tickets" name="Tickets" stroke="#16a34a" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function AttendanceChart({ data }: { data: AttendancePoint[] }) {
  if (data.every((d) => d.checkedIn === 0)) return <ChartEmpty message="No check-ins in this period" />;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => String(v).slice(5)} />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip />
        <Legend />
        <Bar dataKey="checkedIn" name="Checked in" fill="#16a34a" radius={[4, 4, 0, 0]} />
        <Bar dataKey="ticketsIssued" name="Tickets issued" fill="#94a3b8" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ValidationChart({ data }: { data: ValidationActivityPoint[] }) {
  if (data.every((d) => d.total === 0)) return <ChartEmpty message="No QR scans in this period" />;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => String(v).slice(5)} />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip />
        <Legend />
        <Bar dataKey="valid" stackId="a" fill="#16a34a" />
        <Bar dataKey="already_used" stackId="a" fill="#d97706" />
        <Bar dataKey="invalid" stackId="a" fill="#dc2626" />
        <Bar dataKey="expired" stackId="a" fill="#64748b" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function UserGrowthChart({ data }: { data: UserGrowthPoint[] }) {
  if (data.every((d) => d.total === 0)) return <ChartEmpty message="No new users in this period" />;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => String(v).slice(5)} />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="total" name="All users" stroke="#2563eb" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="attendees" name="Attendees" stroke="#16a34a" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="organizers" name="Organizers" stroke="#7c3aed" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function TransferChart({ data }: { data: TransferStatsPoint[] }) {
  if (data.every((d) => d.count === 0)) return <ChartEmpty message="No transfers in this period" />;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => String(v).slice(5)} />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip />
        <Bar dataKey="count" name="Transfers" fill="#2563eb" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
