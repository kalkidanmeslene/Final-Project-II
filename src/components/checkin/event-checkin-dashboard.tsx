"use client";

import { useCallback, useState } from "react";
import {
  useCheckinAnalytics,
  useCheckinMutations,
  useEventStaff,
  useScanHistory,
} from "@/hooks/use-checkin";
import type { ScanResponse } from "@/lib/checkin/checkin.types";
import { QrScanner } from "./qr-scanner";
import { ScanResultBadge } from "./scan-result-badge";
import { PurchasedTicketsLabel } from "./purchased-tickets-label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

type Tab = "scan" | "history" | "analytics" | "staff";

export function EventCheckinDashboard({
  eventId,
  eventTitle,
  canManageStaff,
}: {
  eventId: string;
  eventTitle: string;
  canManageStaff: boolean;
}) {
  const [tab, setTab] = useState<Tab>("scan");
  const [lastScan, setLastScan] = useState<ScanResponse | null>(null);
  const [manualPayload, setManualPayload] = useState("");
  const [staffEmail, setStaffEmail] = useState("");

  const { data: analyticsData, isLoading: analyticsLoading } = useCheckinAnalytics(eventId);
  const { data: historyData, isLoading: historyLoading } = useScanHistory(eventId);
  const { data: staffData } = useEventStaff(eventId);
  const { scan, addStaff, removeStaff } = useCheckinMutations(eventId);

  const submitPayload = useCallback(
    async (payload: string) => {
      if (!payload.trim() || scan.isPending) return;
      try {
        const { scan: result } = await scan.mutateAsync(payload.trim());
        setLastScan(result);
      } catch (e) {
        setLastScan({
          result: "invalid",
          message: e instanceof Error ? e.message : "Scan failed.",
          checkedIn: false,
        });
      }
    },
    [scan],
  );

  const tabs: { id: Tab; label: string }[] = [
    { id: "scan", label: "Scanner" },
    { id: "history", label: "History" },
    { id: "analytics", label: "Analytics" },
    ...(canManageStaff ? [{ id: "staff" as Tab, label: "Staff" }] : []),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{eventTitle}</h1>
        <p className="mt-1 text-muted-foreground">QR Code Ticket Validation</p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        {tabs.map((t) => (
          <Button
            key={t.id}
            type="button"
            variant={tab === t.id ? "default" : "outline"}
            className="h-8 px-3 text-xs"
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      <div className={cn("space-y-8", tab !== "scan" && "hidden")} aria-hidden={tab !== "scan"}>
          <div className="rounded-xl border border-border bg-card p-8 shadow-lg">
            <div className="mb-6 text-center">
              <h2 className="mb-2 text-2xl font-bold">Scan QR Code</h2>
              <p className="text-muted-foreground">Point your camera at the attendee&apos;s ticket QR code</p>
            </div>
            <QrScanner onScan={submitPayload} isProcessing={scan.isPending} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Manual entry</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="manual-qr">Paste QR payload</Label>
                <Input
                  id="manual-qr"
                  value={manualPayload}
                  onChange={(e) => setManualPayload(e.target.value)}
                  placeholder="hibir:v1:..."
                  className="mt-1 font-mono text-xs"
                />
              </div>
              <Button
                type="button"
                disabled={!manualPayload.trim() || scan.isPending}
                onClick={() => void submitPayload(manualPayload)}
              >
                Validate
              </Button>
            </CardContent>
          </Card>

          {scan.isPending && <Spinner label="Validating" />}

          {lastScan && (
            <div
              className={cn(
                "rounded-xl border-2 p-6 shadow-lg",
                lastScan.result === "valid"
                  ? "border-success bg-success/10"
                  : lastScan.result === "already_used"
                    ? "border-amber-500 bg-amber-50"
                    : "border-destructive bg-destructive/10",
              )}
            >
              <div className="flex items-start gap-4">
                <ScanResultBadge result={lastScan.result} />
                <div className="flex-1 space-y-2 text-sm">
                  <p className="text-lg font-bold">{lastScan.message}</p>
                  {lastScan.ticket && (
                    <>
                      <p className="font-mono">{lastScan.ticket.ticketCode}</p>
                      <p className="font-semibold">{lastScan.ticket.holderName}</p>
                      <PurchasedTicketsLabel
                        purchasedTickets={lastScan.ticket.purchasedTickets}
                        scannedTicketTypeName={lastScan.ticket.ticketTypeName}
                        showOrderSummary={false}
                        className="space-y-1"
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
      </div>

      {tab === "history" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Validation history</CardTitle>
          </CardHeader>
          <CardContent>
            {historyLoading && <Spinner label="Loading history" />}
            {!historyLoading && historyData?.history.length === 0 && (
              <p className="text-sm text-muted-foreground">No scans yet.</p>
            )}
            <ul className="divide-y divide-border">
              {historyData?.history.map((row) => (
                <li key={row.id} className="flex flex-wrap items-start justify-between gap-2 py-3 text-sm">
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="font-mono text-xs">{row.ticketCode ?? "—"}</p>
                    <p className="font-medium">{row.holderName ?? "Unknown"}</p>
                    <PurchasedTicketsLabel
                      purchasedTickets={row.purchasedTickets}
                      scannedTicketTypeName={row.ticketTypeName}
                      showOrderSummary={false}
                    />
                    <p className="text-xs text-muted-foreground">
                      Scanned by {row.scannedByName} · {new Date(row.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <ScanResultBadge result={row.result} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {tab === "analytics" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {analyticsLoading && <Spinner label="Loading analytics" />}
          {analyticsData?.analytics && (
            <>
              <StatCard label="Total tickets" value={analyticsData.analytics.totalTickets} />
              <StatCard label="Checked in" value={analyticsData.analytics.checkedIn} highlight />
              <StatCard label="Remaining" value={analyticsData.analytics.remaining} />
              <StatCard
                label="Valid scans"
                value={analyticsData.analytics.scanCounts.valid}
                sub={`Rejected: ${analyticsData.analytics.scanCounts.invalid + analyticsData.analytics.scanCounts.already_used + analyticsData.analytics.scanCounts.expired}`}
              />
              <Card className="sm:col-span-2 lg:col-span-4">
                <CardHeader>
                  <CardTitle className="text-base">Scan breakdown</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <p>Valid: {analyticsData.analytics.scanCounts.valid}</p>
                  <p>Already used: {analyticsData.analytics.scanCounts.already_used}</p>
                  <p>Expired: {analyticsData.analytics.scanCounts.expired}</p>
                  <p>Invalid: {analyticsData.analytics.scanCounts.invalid}</p>
                </CardContent>
              </Card>
              <Card className="sm:col-span-2 lg:col-span-4">
                <CardHeader>
                  <CardTitle className="text-base">Recent check-ins</CardTitle>
                </CardHeader>
                <CardContent>
                  {analyticsData.analytics.recentValid.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No check-ins yet.</p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {analyticsData.analytics.recentValid.map((r) => (
                        <li key={r.ticketCode} className="border-b border-border py-2 last:border-0">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <span className="font-mono text-xs">{r.ticketCode}</span>
                            <span className="text-muted-foreground">{new Date(r.checkedInAt).toLocaleTimeString()}</span>
                          </div>
                          <p className="font-medium">{r.holderName}</p>
                          <PurchasedTicketsLabel
                            purchasedTickets={r.purchasedTickets}
                            scannedTicketTypeName={r.ticketTypeName}
                            showOrderSummary={false}
                            className="text-xs"
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {tab === "staff" && canManageStaff && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Event staff</CardTitle>
            <p className="text-sm text-muted-foreground">Staff can scan tickets at the door. Managers have the same scan access.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Label htmlFor="staff-email">User email</Label>
                <Input
                  id="staff-email"
                  type="email"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="staff@example.com"
                  className="mt-1"
                />
              </div>
              <Button
                type="button"
                disabled={!staffEmail || addStaff.isPending}
                onClick={async () => {
                  try {
                    await addStaff.mutateAsync({ email: staffEmail, role: "scanner" });
                    setStaffEmail("");
                  } catch (e) {
                    alert(e instanceof Error ? e.message : "Could not add staff.");
                  }
                }}
              >
                Add scanner
              </Button>
            </div>
            {addStaff.isError && (
              <Alert variant="destructive" role="alert">
                Could not add staff member.
              </Alert>
            )}
            <ul className="divide-y divide-border">
              {staffData?.staff.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium">{s.fullName}</p>
                    <p className="text-muted-foreground">{s.email}</p>
                    <p className="text-xs capitalize text-muted-foreground">{s.role}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-xs text-red-600"
                    disabled={removeStaff.isPending}
                    onClick={() => void removeStaff.mutateAsync(s.id)}
                  >
                    Remove
                  </Button>
                </li>
              ))}
              {staffData?.staff.length === 0 && <p className="text-sm text-muted-foreground">No staff assigned.</p>}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: number;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "border-emerald-300 dark:border-emerald-800" : undefined}>
      <CardContent className="pt-6">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-3xl font-semibold">{value}</p>
        {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}
