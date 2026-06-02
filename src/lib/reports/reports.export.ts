import type { ReportsDashboardData, ReportExportType } from "./reports.types";

function escapeCsv(value: string | number | null | undefined): string {
  const s = value == null ? "" : String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function rowsToCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const lines = [headers.map(escapeCsv).join(",")];
  for (const row of rows) {
    lines.push(row.map(escapeCsv).join(","));
  }
  return lines.join("\n");
}

export function buildReportCsv(data: ReportsDashboardData, type: ReportExportType): string {
  const sections: string[] = [];
  const header = `# Hibir Events Report (${data.scope}) ${data.range.from.slice(0, 10)} to ${data.range.to.slice(0, 10)}`;

  if (type === "summary" || type === "full") {
    sections.push(
      header,
      "Summary",
      rowsToCsv(
        ["metric", "value"],
        [
          ["revenue_etb", data.summary.revenue],
          ["tickets_sold", data.summary.ticketsSold],
          ["bookings", data.summary.bookings],
          ["check_ins", data.summary.checkIns],
          ["transfers", data.summary.transfers],
          ["new_users", data.summary.newUsers],
          ["attendance_rate_pct", data.summary.attendanceRate],
        ],
      ),
    );
  }

  if (type === "ticket_sales" || type === "full") {
    sections.push(
      "",
      "Ticket sales by day",
      rowsToCsv(
        ["date", "revenue_etb", "tickets", "bookings"],
        data.ticketSales.map((r) => [r.date, r.revenue, r.tickets, r.bookings]),
      ),
    );
  }

  if (type === "attendance" || type === "full") {
    sections.push(
      "",
      "Attendance by day",
      rowsToCsv(
        ["date", "checked_in", "tickets_issued", "rate_pct"],
        data.attendance.map((r) => [r.date, r.checkedIn, r.ticketsIssued, r.rate]),
      ),
    );
  }

  if (type === "event_popularity" || type === "full") {
    sections.push(
      "",
      "Event popularity",
      rowsToCsv(
        ["event", "organizer", "tickets_sold", "capacity", "revenue_etb", "check_ins", "avg_rating"],
        data.eventPopularity.map((r) => [
          r.title,
          r.organizerName,
          r.ticketsSold,
          r.capacity,
          r.revenue,
          r.checkIns,
          r.averageRating,
        ]),
      ),
    );
  }

  if ((type === "organizer_performance" || type === "full") && data.scope === "admin") {
    sections.push(
      "",
      "Organizer performance",
      rowsToCsv(
        ["organizer", "events", "tickets_sold", "revenue_etb", "check_ins", "avg_rating"],
        data.organizerPerformance.map((r) => [
          r.organizerName,
          r.eventsCount,
          r.ticketsSold,
          r.revenue,
          r.checkIns,
          r.averageRating,
        ]),
      ),
    );
  }

  if (type === "revenue" || type === "full") {
    sections.push(
      "",
      "Revenue simulation",
      rowsToCsv(
        ["metric", "value"],
        [
          ["actual_revenue_etb", data.revenueSimulation.actualRevenue],
          ["projected_revenue_etb", data.revenueSimulation.projectedRevenue],
          ["remaining_capacity", data.revenueSimulation.remainingCapacity],
          ["sell_through_pct", data.revenueSimulation.sellThroughRate],
        ],
      ),
    );
  }

  if (type === "validation" || type === "full") {
    sections.push(
      "",
      "Validation activity",
      rowsToCsv(
        ["date", "valid", "already_used", "expired", "invalid", "total"],
        data.validationActivity.map((r) => [
          r.date,
          r.valid,
          r.already_used,
          r.expired,
          r.invalid,
          r.total,
        ]),
      ),
    );
  }

  if ((type === "user_growth" || type === "full") && data.scope === "admin") {
    sections.push(
      "",
      "User growth",
      rowsToCsv(
        ["date", "new_users", "attendees", "organizers"],
        data.userGrowth.map((r) => [r.date, r.total, r.attendees, r.organizers]),
      ),
    );
  }

  if (type === "transfers" || type === "full") {
    sections.push(
      "",
      "Transfers by day",
      rowsToCsv(
        ["date", "count"],
        data.transferStats.map((r) => [r.date, r.count]),
      ),
    );
  }

  return sections.join("\n");
}

export function buildReportPdfHtml(data: ReportsDashboardData, type: ReportExportType): string {
  const title = `Hibir Events — ${data.scope} report`;
  const period = `${data.range.from.slice(0, 10)} → ${data.range.to.slice(0, 10)}`;

  const table = (headers: string[], rows: string[][]) => `
    <table>
      <thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
      <tbody>
        ${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}
      </tbody>
    </table>
  `;

  let body = `<h1>${title}</h1><p>${period}</p>`;

  if (type === "summary" || type === "full") {
    body += `<h2>Summary</h2>${table(
      ["Metric", "Value"],
      [
        ["Revenue (ETB)", String(data.summary.revenue)],
        ["Tickets sold", String(data.summary.ticketsSold)],
        ["Bookings", String(data.summary.bookings)],
        ["Check-ins", String(data.summary.checkIns)],
        ["Transfers", String(data.summary.transfers)],
        ["New users", String(data.summary.newUsers)],
        ["Attendance rate", `${data.summary.attendanceRate}%`],
      ],
    )}`;
  }

  if (type === "ticket_sales" || type === "full") {
    body += `<h2>Ticket sales</h2>${table(
      ["Date", "Revenue", "Tickets", "Bookings"],
      data.ticketSales.map((r) => [r.date, String(r.revenue), String(r.tickets), String(r.bookings)]),
    )}`;
  }

  if (type === "event_popularity" || type === "full") {
    body += `<h2>Event popularity</h2>${table(
      ["Event", "Tickets", "Revenue", "Check-ins"],
      data.eventPopularity.slice(0, 25).map((r) => [
        r.title,
        String(r.ticketsSold),
        String(r.revenue),
        String(r.checkIns),
      ]),
    )}`;
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 24px; color: #111; }
    h1 { font-size: 20px; } h2 { font-size: 16px; margin-top: 24px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
    th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
    th { background: #f4f4f5; }
  </style>
</head>
<body>${body}</body>
</html>`;
}
