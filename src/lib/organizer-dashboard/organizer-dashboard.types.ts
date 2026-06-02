export type DashboardOverview = {
  totalEvents: number;
  publishedEvents: number;
  ticketsSold: number;
  totalCapacity: number;
  revenue: number;
  checkIns: number;
  pendingReviews: number;
  averageRating: number | null;
  totalTransfers: number;
};

export type SalesDataPoint = {
  date: string;
  revenue: number;
  tickets: number;
};

export type EventPerformanceRow = {
  id: string;
  title: string;
  slug: string;
  status: string;
  startsAt: string;
  sold: number;
  capacity: number;
  checkedIn: number;
  revenue: number;
  averageRating: number | null;
  reviewCount: number;
};

export type RevenueSimulation = {
  actualRevenue: number;
  projectedRevenue: number;
  remainingCapacity: number;
  sellThroughRate: number;
};

export type CheckinSummary = {
  totalTickets: number;
  checkedIn: number;
  remaining: number;
  scanCounts: { valid: number; already_used: number; expired: number; invalid: number };
};

export type AttendeeRow = {
  ticketId: string;
  ticketCode: string;
  holderName: string;
  email: string | null;
  phone: string | null;
  ticketType: string;
  checkedIn: boolean;
  checkedInAt: string | null;
};

export type TransferRow = {
  id: string;
  ticketCode: string;
  eventTitle: string;
  fromName: string;
  toName: string;
  createdAt: string;
};

export type FeedbackRow = {
  id: string;
  eventTitle: string;
  rating: number;
  comment: string;
  status: string;
  authorName: string;
  createdAt: string;
};

export type DashboardEventSummary = {
  id: string;
  title: string;
  slug: string;
  status: string;
  startsAt: string;
  bannerUrl: string | null;
  sold: number;
  capacity: number;
  revenue: number;
};

export type OrganizerDashboardData = {
  overview: DashboardOverview;
  salesByDay: SalesDataPoint[];
  revenueByEvent: { name: string; revenue: number; sold: number }[];
  performance: EventPerformanceRow[];
  revenueSimulation: RevenueSimulation;
  checkinSummary: CheckinSummary;
  events: DashboardEventSummary[];
  transfers: TransferRow[];
  feedback: FeedbackRow[];
  pendingReviewsCount: number;
};
