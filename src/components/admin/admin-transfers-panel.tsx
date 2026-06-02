"use client";

import { useAdminTransfers } from "@/hooks/use-transfer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";

export function AdminTransfersPanel() {
  const { data, isLoading, isError } = useAdminTransfers();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ticket transfers</CardTitle>
        <CardDescription>Audit trail of ticket ownership changes across the platform.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && <Spinner label="Loading transfers" />}
        {isError && <Alert variant="destructive">Failed to load transfer history.</Alert>}
        {!isLoading && data?.history.length === 0 && (
          <p className="text-sm text-muted-foreground">No transfers recorded yet.</p>
        )}
        <ul className="divide-y divide-border">
          {data?.history.map((t) => (
            <li key={t.id} className="flex flex-col gap-1 py-3 text-sm">
              <p className="font-medium">{t.eventTitle}</p>
              <p className="font-mono text-xs text-muted-foreground">{t.ticketCode}</p>
              <p>
                {t.fromUserName} ({t.fromUserEmail ?? "no email"}) → {t.toUserName} (
                {t.toUserEmail ?? "no email"})
              </p>
              <p className="text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
