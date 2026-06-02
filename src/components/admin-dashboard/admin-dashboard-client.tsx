"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import {
  Activity,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  DollarSign,
  Shield,
  Ticket,
  Users,
  UserX,
} from "lucide-react";
import { ApiClientError } from "@/lib/api/fetch-json";
import type { AdminDashboardData } from "@/lib/admin-dashboard/admin-dashboard.types";
import type { ReportsDashboardData } from "@/lib/reports/reports.types";
import { ReportsHub } from "@/components/reports/reports-hub";
import {
  useAdminApplications,
  useAdminAuditLogs,
  useAdminCategories,
  useAdminDashboard,
  useAdminLocations,
  useAdminMutations,
  useAdminPendingEventsList,
  useAdminSettings,
  useAdminUsers,
} from "@/hooks/use-admin-dashboard";
import { ReviewModerationPanel } from "@/components/admin/review-moderation-panel";
import { AdminTransfersPanel } from "@/components/admin/admin-transfers-panel";
import { DashboardStatCard } from "@/components/organizer-dashboard/dashboard-stat-card";
import { AdminConfirmDialog } from "./admin-confirm-dialog";
import { AdminDataTable, TablePagination } from "./admin-data-table";
import { AdminEventStatusChart, AdminRolePieChart, AdminSalesChart } from "./admin-dashboard-charts";
import { AdminDashboardLayout, AdminSection } from "./admin-dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { formatCurrency, formatDate } from "@/lib/format";
import { formatEventDate, formatPrice } from "@/lib/events/format";

type ConfirmState = {
  title: string;
  description: string;
  confirmLabel: string;
  variant?: "default" | "danger";
  onConfirm: () => Promise<void>;
};

function statusBadge(status: string) {
  switch (status) {
    case "active":
    case "approved":
      return <Badge variant="success">{status}</Badge>;
    case "pending":
      return <Badge variant="info">pending</Badge>;
    case "suspended":
    case "rejected":
      return <Badge variant="danger">{status}</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

function systemStatusBadge(status: AdminDashboardData["overview"]["systemStatus"]) {
  switch (status) {
    case "healthy":
      return <Badge variant="success">Healthy</Badge>;
    case "degraded":
      return <Badge variant="warning">Degraded</Badge>;
    case "maintenance":
      return <Badge variant="danger">Maintenance</Badge>;
  }
}

export function AdminDashboardClient({
  initial,
  reportsInitial,
}: {
  initial: AdminDashboardData;
  reportsInitial?: ReportsDashboardData;
}) {
  const { data, isLoading } = useAdminDashboard(initial);
  const dashboard = data ?? initial;
  const mutations = useAdminMutations();

  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [userRole, setUserRole] = useState("organizer");
  const [userStatus, setUserStatus] = useState("all");
  const [userQ, setUserQ] = useState("");
  const [userOffset, setUserOffset] = useState(0);
  const userLimit = 20;

  const [auditAction, setAuditAction] = useState("");
  const [auditQ, setAuditQ] = useState("");
  const [auditOffset, setAuditOffset] = useState(0);
  const auditLimit = 30;

  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [locName, setLocName] = useState("");
  const [locCity, setLocCity] = useState("");

  const { data: usersPage, isLoading: usersLoading } = useAdminUsers({
    role: userRole,
    status: userStatus,
    q: userQ || undefined,
    limit: userLimit,
    offset: userOffset,
  });

  const { data: auditPage, isLoading: auditLoading } = useAdminAuditLogs({
    action: auditAction || undefined,
    q: auditQ || undefined,
    limit: auditLimit,
    offset: auditOffset,
  });

  const { data: applications, isLoading: appsLoading, refetch: refetchApps } = useAdminApplications();
  const { data: pendingEvents, isLoading: eventsLoading, refetch: refetchEvents } = useAdminPendingEventsList();
  const { data: categories, isLoading: catsLoading } = useAdminCategories();
  const { data: locations, isLoading: locsLoading } = useAdminLocations();
  const { data: settings, isLoading: settingsLoading } = useAdminSettings();

  const o = dashboard.overview;

  async function runConfirm(action: () => Promise<void>) {
    setConfirmLoading(true);
    try {
      await action();
      setConfirm(null);
    } catch (e) {
      toast.error(e instanceof ApiClientError ? e.message : "Action failed.");
    } finally {
      setConfirmLoading(false);
    }
  }

  function openConfirm(state: ConfirmState) {
    setConfirm(state);
  }

  if (isLoading && !dashboard) {
    return <Spinner label="Loading admin dashboard" />;
  }

  return (
    <AdminDashboardLayout>
      <div className="mb-2">
        <h1 className="text-2xl font-bold sm:text-3xl">Admin Dashboard</h1>
        <p className="text-muted-foreground">Platform moderation, analytics, and configuration</p>
      </div>

      <AdminSection id="overview" title="Platform overview" description="High-level metrics and recent activity.">
        <div className="mb-4 flex items-center gap-2">
          {systemStatusBadge(o.systemStatus)}
          {o.pendingOrganizerApps > 0 && (
            <Badge variant="warning">{o.pendingOrganizerApps} organizer apps pending</Badge>
          )}
          {o.pendingEvents > 0 && <Badge variant="warning">{o.pendingEvents} events pending</Badge>}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard label="Total users" value={o.totalUsers.toLocaleString()} icon={Users} />
          <DashboardStatCard
            label="Organizers"
            value={o.totalOrganizers.toLocaleString()}
            icon={Shield}
            hint={`${o.activeOrganizers} active`}
          />
          <DashboardStatCard label="Platform revenue" value={formatCurrency(o.totalRevenue)} icon={DollarSign} />
          <DashboardStatCard label="Tickets sold" value={o.ticketsSold.toLocaleString()} icon={Ticket} />
        </div>
        <div className="mt-4 rounded-xl border border-border bg-card p-5">
          <p className="mb-3 text-sm font-medium text-muted-foreground">Recent audit activity</p>
          <ul className="space-y-2 text-sm">
            {dashboard.recentAudit.length === 0 && (
              <li className="text-muted-foreground">No audit entries yet.</li>
            )}
            {dashboard.recentAudit.map((log) => (
              <li key={log.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-2 last:border-0">
                <span className="font-mono text-xs">{log.action}</span>
                <span className="text-muted-foreground">{log.userName ?? "System"}</span>
                <span className="text-xs text-muted-foreground">{formatDate(log.createdAt)}</span>
              </li>
            ))}
          </ul>
        </div>
      </AdminSection>

      <AdminSection id="monitoring" title="Platform monitoring" description="Health signals and operational alerts.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DashboardStatCard
            label="Check-ins today"
            value={o.checkInsToday.toLocaleString()}
            icon={CheckCircle2}
          />
          <DashboardStatCard
            label="Failed logins (24h)"
            value={o.failedLogins24h.toLocaleString()}
            icon={AlertTriangle}
            hint={o.failedLogins24h > 50 ? "Elevated — review audit logs" : "Within normal range"}
          />
          <DashboardStatCard label="Suspended accounts" value={o.suspendedUsers.toLocaleString()} icon={UserX} />
          <DashboardStatCard label="Pending reviews" value={o.pendingReviews.toLocaleString()} icon={Activity} />
          <DashboardStatCard label="Total bookings" value={o.totalBookings.toLocaleString()} icon={Ticket} />
          <DashboardStatCard label="Ticket transfers" value={o.transfersTotal.toLocaleString()} icon={Calendar} />
        </div>
      </AdminSection>

      <AdminSection id="organizers" title="Manage organizers" description="Search, filter, and moderate organizer accounts.">
        <div className="mb-4 flex flex-wrap gap-3">
          <div>
            <Label htmlFor="user-q">Search</Label>
            <Input
              id="user-q"
              className="mt-1 w-48"
              placeholder="Name, email, org…"
              value={userQ}
              onChange={(e) => {
                setUserQ(e.target.value);
                setUserOffset(0);
              }}
            />
          </div>
          <div>
            <Label htmlFor="user-role">Role</Label>
            <select
              id="user-role"
              className="mt-1 block rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={userRole}
              onChange={(e) => {
                setUserRole(e.target.value);
                setUserOffset(0);
              }}
            >
              <option value="organizer">Organizer</option>
              <option value="admin">Admin</option>
              <option value="attendee">Attendee</option>
              <option value="all">All</option>
            </select>
          </div>
          <div>
            <Label htmlFor="user-status">Status</Label>
            <select
              id="user-status"
              className="mt-1 block rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={userStatus}
              onChange={(e) => {
                setUserStatus(e.target.value);
                setUserOffset(0);
              }}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
        <AdminDataTable
          loading={usersLoading}
          columns={[
            { key: "name", label: "User" },
            { key: "org", label: "Organization" },
            { key: "role", label: "Role" },
            { key: "status", label: "Status" },
            { key: "events", label: "Events" },
            { key: "actions", label: "Actions", className: "text-right" },
          ]}
          rows={(usersPage?.items ?? []).map((u) => ({
            id: u.id,
            cells: [
              <div key="name">
                <p className="font-medium">{u.fullName}</p>
                <p className="text-xs text-muted-foreground">{u.email ?? u.phoneNumber ?? "—"}</p>
              </div>,
              u.organizationName ?? "—",
              u.role,
              statusBadge(u.status),
              String(u.eventsCount),
              u.role !== "admin" ? (
                u.status === "suspended" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      openConfirm({
                        title: "Reactivate account",
                        description: `Restore access for ${u.fullName}?`,
                        confirmLabel: "Reactivate",
                        onConfirm: async () => {
                          await mutations.unsuspendUser.mutateAsync(u.id);
                          toast.success("Account reactivated.");
                        },
                      })
                    }
                  >
                    Reactivate
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() =>
                      openConfirm({
                        title: "Suspend account",
                        description: `Suspend ${u.fullName}? They will not be able to sign in.`,
                        confirmLabel: "Suspend",
                        variant: "danger",
                        onConfirm: async () => {
                          await mutations.suspendUser.mutateAsync(u.id);
                          toast.success("Account suspended.");
                        },
                      })
                    }
                  >
                    Suspend
                  </Button>
                )
              ) : (
                <span className="text-xs text-muted-foreground">Protected</span>
              ),
            ],
          }))}
          footer={
            usersPage ? (
              <TablePagination
                offset={userOffset}
                limit={userLimit}
                total={usersPage.total}
                hasMore={usersPage.hasMore}
                onPrev={() => setUserOffset(Math.max(0, userOffset - userLimit))}
                onNext={() => setUserOffset(userOffset + userLimit)}
              />
            ) : undefined
          }
        />
      </AdminSection>

      <AdminSection
        id="applications"
        title="Organizer applications"
        description="Approve or reject requests to become an organizer."
      >
        {appsLoading ? (
          <Spinner label="Loading applications" />
        ) : (
          <div className="space-y-3">
            {(applications ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">No pending organizer applications.</p>
            )}
            {(applications ?? []).map((app) => (
              <div key={app.userId} className="rounded-xl border border-border bg-card p-4">
                <p className="font-medium">{app.fullName}</p>
                <p className="text-sm text-muted-foreground">{app.email}</p>
                <p className="mt-1 text-sm">{app.organizationName}</p>
                <p className="text-xs text-muted-foreground">Applied {formatDate(app.createdAt)}</p>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      openConfirm({
                        title: "Approve organizer",
                        description: `Approve ${app.fullName} as an organizer?`,
                        confirmLabel: "Approve",
                        onConfirm: async () => {
                          await mutations.approveOrganizer.mutateAsync({ userId: app.userId });
                          toast.success("Organizer approved.");
                          void refetchApps();
                        },
                      })
                    }
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      openConfirm({
                        title: "Reject application",
                        description: `Reject ${app.fullName}'s organizer application?`,
                        confirmLabel: "Reject",
                        variant: "danger",
                        onConfirm: async () => {
                          await mutations.rejectOrganizer.mutateAsync({ userId: app.userId });
                          toast.success("Application rejected.");
                          void refetchApps();
                        },
                      })
                    }
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminSection>

      <AdminSection id="events" title="Event moderation" description="Approve or reject submitted events.">
        {eventsLoading ? (
          <Spinner label="Loading pending events" />
        ) : (
          <div className="space-y-3">
            {(pendingEvents ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">No events awaiting approval.</p>
            )}
            {(pendingEvents ?? []).map((e) => (
              <div key={e.id} className="rounded-xl border border-border bg-card p-4">
                <p className="font-medium">{e.title}</p>
                <p className="text-sm text-muted-foreground">
                  {formatEventDate(e.startsAt)} · {formatPrice(e.ticketPrice)}
                </p>
                <p className="text-sm">
                  {e.venue}, {e.location}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={`/events/${e.slug}`}>
                    <Button size="sm" variant="outline">
                      Preview
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    onClick={() =>
                      openConfirm({
                        title: "Approve event",
                        description: `Publish "${e.title}" on the platform?`,
                        confirmLabel: "Approve",
                        onConfirm: async () => {
                          await mutations.approveEvent.mutateAsync({ id: e.id });
                          toast.success("Event approved.");
                          void refetchEvents();
                        },
                      })
                    }
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      openConfirm({
                        title: "Reject event",
                        description: `Send "${e.title}" back to draft? The organizer will be notified.`,
                        confirmLabel: "Reject",
                        variant: "danger",
                        onConfirm: async () => {
                          await mutations.rejectEvent.mutateAsync({ id: e.id });
                          toast.success("Event rejected.");
                          void refetchEvents();
                        },
                      })
                    }
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminSection>

      <AdminSection id="reviews" title="Review moderation" description="Approve feedback before it affects ratings.">
        <ReviewModerationPanel />
      </AdminSection>

      <AdminSection id="transfers" title="Transfer audit" description="Platform-wide ticket transfer history.">
        <AdminTransfersPanel />
      </AdminSection>

      <AdminSection id="analytics" title="Analytics" description="Revenue trends and distribution charts.">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="mb-3 text-sm font-medium text-muted-foreground">Revenue & bookings (30 days)</p>
            <AdminSalesChart data={dashboard.salesByDay} />
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="mb-3 text-sm font-medium text-muted-foreground">Users by role</p>
            <AdminRolePieChart data={dashboard.usersByRole} />
          </div>
          <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
            <p className="mb-3 text-sm font-medium text-muted-foreground">Events by status</p>
            <AdminEventStatusChart data={dashboard.eventsByStatus} />
          </div>
        </div>
      </AdminSection>

      <AdminSection
        id="reports"
        title="Reports & exports"
        description="Ticket sales, attendance, organizers, validation, transfers, and user growth."
      >
        <ReportsHub scope="admin" initial={reportsInitial} />
      </AdminSection>

      <AdminSection id="audit" title="Audit logs" description="Searchable trail of security and admin actions.">
        <div className="mb-4 flex flex-wrap gap-3">
          <div>
            <Label htmlFor="audit-action">Action</Label>
            <Input
              id="audit-action"
              className="mt-1 w-40"
              placeholder="e.g. login_failed"
              value={auditAction}
              onChange={(e) => {
                setAuditAction(e.target.value);
                setAuditOffset(0);
              }}
            />
          </div>
          <div>
            <Label htmlFor="audit-q">Search</Label>
            <Input
              id="audit-q"
              className="mt-1 w-48"
              placeholder="User or IP"
              value={auditQ}
              onChange={(e) => {
                setAuditQ(e.target.value);
                setAuditOffset(0);
              }}
            />
          </div>
        </div>
        <AdminDataTable
          loading={auditLoading}
          columns={[
            { key: "action", label: "Action" },
            { key: "user", label: "User" },
            { key: "ip", label: "IP" },
            { key: "when", label: "When" },
          ]}
          rows={(auditPage?.items ?? []).map((log) => ({
            id: log.id,
            cells: [
              <span key="a" className="font-mono text-xs">
                {log.action}
              </span>,
              log.userName ?? "—",
              log.ipAddress ?? "—",
              formatDate(log.createdAt),
            ],
          }))}
          footer={
            auditPage ? (
              <TablePagination
                offset={auditOffset}
                limit={auditLimit}
                total={auditPage.total}
                hasMore={auditPage.hasMore}
                onPrev={() => setAuditOffset(Math.max(0, auditOffset - auditLimit))}
                onNext={() => setAuditOffset(auditOffset + auditLimit)}
              />
            ) : undefined
          }
        />
      </AdminSection>

      <AdminSection id="categories" title="Event categories" description="Manage discovery categories.">
        <form
          className="mb-4 flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void mutations.createCategory
              .mutateAsync({ name: catName, slug: catSlug || undefined })
              .then(() => {
                toast.success("Category created.");
                setCatName("");
                setCatSlug("");
              })
              .catch((err) => toast.error(err instanceof ApiClientError ? err.message : "Failed."));
          }}
        >
          <div>
            <Label htmlFor="cat-name">Name</Label>
            <Input id="cat-name" className="mt-1" value={catName} onChange={(e) => setCatName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="cat-slug">Slug (optional)</Label>
            <Input id="cat-slug" className="mt-1" value={catSlug} onChange={(e) => setCatSlug(e.target.value)} />
          </div>
          <Button type="submit" disabled={!catName.trim() || mutations.createCategory.isPending}>
            Add category
          </Button>
        </form>
        {catsLoading ? (
          <Spinner />
        ) : (
          <AdminDataTable
            columns={[
              { key: "name", label: "Name" },
              { key: "slug", label: "Slug" },
              { key: "events", label: "Events" },
              { key: "actions", label: "", className: "text-right" },
            ]}
            rows={(categories ?? []).map((c) => ({
              id: c.id,
              cells: [
                c.name,
                <span key="s" className="font-mono text-xs">
                  {c.slug}
                </span>,
                String(c.eventCount),
                <Button
                  key="del"
                  size="sm"
                  variant="danger"
                  onClick={() =>
                    openConfirm({
                      title: "Delete category",
                      description: `Delete "${c.name}"? Events may lose their category link.`,
                      confirmLabel: "Delete",
                      variant: "danger",
                      onConfirm: async () => {
                        await mutations.deleteCategory.mutateAsync(c.id);
                        toast.success("Category deleted.");
                      },
                    })
                  }
                >
                  Delete
                </Button>,
              ],
            }))}
          />
        )}
      </AdminSection>

      <AdminSection id="locations" title="Event locations" description="Curated cities and venues for organizers.">
        <form
          className="mb-4 flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void mutations.createLocation
              .mutateAsync({ name: locName, city: locCity })
              .then(() => {
                toast.success("Location added.");
                setLocName("");
                setLocCity("");
              })
              .catch((err) => toast.error(err instanceof ApiClientError ? err.message : "Failed."));
          }}
        >
          <div>
            <Label htmlFor="loc-name">Venue / area</Label>
            <Input id="loc-name" className="mt-1" value={locName} onChange={(e) => setLocName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="loc-city">City</Label>
            <Input id="loc-city" className="mt-1" value={locCity} onChange={(e) => setLocCity(e.target.value)} required />
          </div>
          <Button type="submit" disabled={!locName.trim() || !locCity.trim() || mutations.createLocation.isPending}>
            Add location
          </Button>
        </form>
        {locsLoading ? (
          <Spinner />
        ) : (
          <AdminDataTable
            columns={[
              { key: "name", label: "Name" },
              { key: "city", label: "City" },
              { key: "region", label: "Region" },
              { key: "active", label: "Active" },
              { key: "actions", label: "", className: "text-right" },
            ]}
            rows={(locations ?? []).map((l) => ({
              id: l.id,
              cells: [
                l.name,
                l.city,
                l.region ?? "—",
                l.isActive ? <Badge variant="success">Yes</Badge> : <Badge variant="danger">No</Badge>,
                <Button
                  key="del"
                  size="sm"
                  variant="danger"
                  onClick={() =>
                    openConfirm({
                      title: "Delete location",
                      description: `Remove "${l.name}, ${l.city}"?`,
                      confirmLabel: "Delete",
                      variant: "danger",
                      onConfirm: async () => {
                        await mutations.deleteLocation.mutateAsync(l.id);
                        toast.success("Location removed.");
                      },
                    })
                  }
                >
                  Delete
                </Button>,
              ],
            }))}
          />
        )}
      </AdminSection>

      <AdminSection id="settings" title="System settings" description="Platform-wide configuration and maintenance mode.">
        {settingsLoading || !settings ? (
          <Spinner label="Loading settings" />
        ) : (
          <form
            className="max-w-lg space-y-4 rounded-xl border border-border bg-card p-6"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              void mutations.updateSettings
                .mutateAsync({
                  platformName: String(fd.get("platformName")),
                  supportEmail: String(fd.get("supportEmail")),
                  maxTicketsPerOrder: Number(fd.get("maxTicketsPerOrder")),
                  maintenanceMode: fd.get("maintenanceMode") === "on",
                  allowOrganizerSignup: fd.get("allowOrganizerSignup") === "on",
                })
                .then(() => toast.success("Settings saved."))
                .catch((err) => toast.error(err instanceof ApiClientError ? err.message : "Failed."));
            }}
          >
            <div>
              <Label htmlFor="platformName">Platform name</Label>
              <Input
                id="platformName"
                name="platformName"
                className="mt-1"
                defaultValue={settings.platformName}
                required
              />
            </div>
            <div>
              <Label htmlFor="supportEmail">Support email</Label>
              <Input
                id="supportEmail"
                name="supportEmail"
                type="email"
                className="mt-1"
                defaultValue={settings.supportEmail}
                required
              />
            </div>
            <div>
              <Label htmlFor="maxTicketsPerOrder">Max tickets per order</Label>
              <Input
                id="maxTicketsPerOrder"
                name="maxTicketsPerOrder"
                type="number"
                min={1}
                max={50}
                className="mt-1 w-32"
                defaultValue={settings.maxTicketsPerOrder}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="maintenanceMode" defaultChecked={settings.maintenanceMode} />
              Maintenance mode
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="allowOrganizerSignup" defaultChecked={settings.allowOrganizerSignup} />
              Allow new organizer signups
            </label>
            <Button type="submit" disabled={mutations.updateSettings.isPending}>
              Save settings
            </Button>
          </form>
        )}
      </AdminSection>

      <AdminConfirmDialog
        open={!!confirm}
        title={confirm?.title ?? ""}
        description={confirm?.description ?? ""}
        confirmLabel={confirm?.confirmLabel}
        variant={confirm?.variant}
        loading={confirmLoading}
        onCancel={() => setConfirm(null)}
        onConfirm={() => confirm && runConfirm(confirm.onConfirm)}
      />
    </AdminDashboardLayout>
  );
}
