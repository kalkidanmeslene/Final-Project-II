import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Discover Events | Hibir Events",
  description:
    "Browse and search events in Ethiopia. Filter by category, date, price, and popularity. Book tickets with secure QR verification.",
  alternates: { canonical: "/events" },
};

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
