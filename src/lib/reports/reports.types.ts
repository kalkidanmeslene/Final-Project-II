export type ReportScope = "admin" | "organizer";

export type ReportDateRange = {
  from: string;
  to: string;
  days: number;
};

export type ReportSummary = {
  revenue: number;
  ticketsSold: number;
  bookings: number;
  checkIns: number;
  transfers: number;
  newUsers: number;
  attendanceRate: number;
};

export type TicketSalesPoint = {
  date: string;
  revenue: number;
  tickets: number;
  bookings: number;
};

export type AttendancePoint = {
  date: string;
  checkedIn: number;
  ticketsIssued: number;
  rate: number;
};

export type EventPopularityRow = {
  eventId: string;
  title: string;
  slug: string;
  organizerName: string;
  ticketsSold: number;
  capacity: number;
  revenue: number;
  checkIns: number;
  averageRating: number | null;
};

export type OrganizerPerformanceRow = {
  organizerId: string;
  organizerName: string;
  eventsCount: number;
  ticketsSold: number;
  revenue: number;
  checkIns: number;
  averageRating: number | null;
};

export type RevenueSimulation = {
  actualRevenue: number;
  projectedRevenue: number;
  remainingCapacity: number;
  sellThroughRate: number;
};

export type ValidationActivityPoint = {
  date: string;
  valid: number;
  already_used: number;
  expired: number;
  invalid: number;
  total: number;
};

export type UserGrowthPoint = {
  date: string;
  total: number;
  attendees: number;
  organizers: number;
};

export type TransferStatsPoint = {
  date: string;
  count: number;
};

export type ReportsDashboardData = {
  scope: ReportScope;
  range: ReportDateRange;
  summary: ReportSummary;
  ticketSales: TicketSalesPoint[];
  attendance: AttendancePoint[];
  eventPopularity: EventPopularityRow[];
  organizerPerformance: OrganizerPerformanceRow[];
  revenueSimulation: RevenueSimulation;
  validationActivity: ValidationActivityPoint[];
  userGrowth: UserGrowthPoint[];
  transferStats: TransferStatsPoint[];
};

export type ReportExportType =
  | "summary"
  | "ticket_sales"
  | "attendance"
  | "event_popularity"
  | "organizer_performance"
  | "revenue"
  | "validation"
  | "user_growth"
  | "transfers"
  | "full";
