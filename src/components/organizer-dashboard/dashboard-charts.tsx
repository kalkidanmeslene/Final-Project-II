"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { EventPerformanceRow, SalesDataPoint } from "@/lib/organizer-dashboard/organizer-dashboard.types";
import { formatCurrency } from "@/lib/format";

const COLORS = ["#2563eb", "#16a34a", "#d97706", "#7c3aed", "#dc2626", "#0891b2", "#4f46e5", "#ea580c"];

export function SalesTrendChart({ data }: { data: SalesDataPoint[] }) {
  if (data.every((d) => d.revenue === 0 && d.tickets === 0)) {
    return <ChartEmpty message="No sales in the last 30 days" />;
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
        <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
        <Tooltip
          formatter={(value, name) => {
            const v = Number(value ?? 0);
            return name === "revenue" ? formatCurrency(v) : String(v);
          }}
        />
        <Legend />
        <Line yAxisId="left" type="monotone" dataKey="revenue" name="Revenue (ETB)" stroke="#2563eb" strokeWidth={2} dot={false} />
        <Line yAxisId="right" type="monotone" dataKey="tickets" name="Tickets" stroke="#16a34a" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function RevenueByEventChart({ data }: { data: { name: string; revenue: number }[] }) {
  if (data.length === 0) return <ChartEmpty message="No revenue by event yet" />;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}`} />
        <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
        <Tooltip />
        <Bar dataKey="revenue" name="Revenue" fill="#2563eb" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PerformanceChart({ data }: { data: EventPerformanceRow[] }) {
  const chartData = data
    .filter((e) => e.sold > 0)
    .slice(0, 6)
    .map((e) => ({ name: e.title.slice(0, 18), sold: e.sold, checkedIn: e.checkedIn }));
  if (chartData.length === 0) return <ChartEmpty message="No ticket sales to compare" />;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        <Bar dataKey="sold" name="Sold" fill="#2563eb" radius={[4, 4, 0, 0]} />
        <Bar dataKey="checkedIn" name="Checked in" fill="#16a34a" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CheckinPieChart({
  checkedIn,
  remaining,
}: {
  checkedIn: number;
  remaining: number;
}) {
  const data = [
    { name: "Checked in", value: checkedIn },
    { name: "Not checked in", value: remaining },
  ];
  if (checkedIn === 0 && remaining === 0) {
    return <ChartEmpty message="No tickets issued yet" />;
  }
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function RevenueSimulationChart({
  actual,
  projected,
}: {
  actual: number;
  projected: number;
}) {
  const data = [
    { name: "Actual", value: actual },
    { name: "Projected (full sell-out)", value: projected },
  ];
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="value" name="ETB" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={i === 0 ? "#2563eb" : "#94a3b8"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="flex h-[240px] items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
      {message}
    </div>
  );
}
