"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Activity,
  Users,
  UserPlus,
  Calendar,
  MessageSquare,
  ArrowLeftRight,
  BarChart3,
  ScrollText,
  Tags,
  MapPin,
  Settings,
  Menu,
  X,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

const NAV = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "monitoring", label: "Monitoring", icon: Activity },
  { id: "organizers", label: "Organizers", icon: Users },
  { id: "applications", label: "Applications", icon: UserPlus },
  { id: "events", label: "Events", icon: Calendar },
  { id: "reviews", label: "Reviews", icon: MessageSquare },
  { id: "transfers", label: "Transfers", icon: ArrowLeftRight },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "audit", label: "Audit logs", icon: ScrollText },
  { id: "categories", label: "Categories", icon: Tags },
  { id: "locations", label: "Locations", icon: MapPin },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

export type AdminSectionId = (typeof NAV)[number]["id"];

export function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [active, setActive] = useState<AdminSectionId>("overview");

  function scrollTo(id: AdminSectionId) {
    setActive(id);
    setMobileOpen(false);
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  const nav = (
    <nav className="flex flex-col gap-1 p-3" aria-label="Admin sections">
      {NAV.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => scrollTo(item.id)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
              active === item.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
        <div className="flex h-14 items-center justify-between gap-4 px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg p-2 lg:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link href="/" className="font-semibold text-foreground">
              Hibir Events
            </Link>
            <span className="hidden text-sm text-muted-foreground sm:inline">Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/profile">
              <Button variant="outline" size="sm">
                Profile
              </Button>
            </Link>
            <Button variant="danger" size="sm" onClick={handleLogout}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-30 w-64 border-r border-border bg-card pt-14 transition-transform lg:static lg:translate-x-0 lg:pt-0",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex h-full flex-col overflow-y-auto">
            {user && (
              <p className="border-b border-border px-4 py-3 text-xs text-muted-foreground">{user.fullName}</p>
            )}
            {nav}
          </div>
        </aside>

        {mobileOpen && (
          <button
            type="button"
            className="fixed inset-0 z-20 bg-black/40 lg:hidden"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <main className="min-w-0 flex-1 px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

export function AdminSection({
  id,
  title,
  description,
  children,
}: {
  id: AdminSectionId;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={`section-${id}`} className="scroll-mt-20 pb-12">
      <div className="mb-6">
        <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}
