"use client";

import { useCallback, useEffect, useState } from "react";
import type { ApiResponse } from "@/lib/http/api-response";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

type PendingOrganizer = {
  userId: string;
  fullName: string;
  email: string | null;
  organizationName: string;
  status: string;
  createdAt: string;
};

export function AdminOrganizerQueue() {
  const [organizers, setOrganizers] = useState<PendingOrganizer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/organizers/pending", { credentials: "include" });
    const json = (await res.json()) as ApiResponse<{ organizers: PendingOrganizer[] }>;
    setLoading(false);
    if (!json.ok) {
      setError(json.error.message);
      return;
    }
    setOrganizers(json.data.organizers);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function act(userId: string, action: "approve" | "reject") {
    const res = await fetch(`/api/admin/organizers/${userId}/${action}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const json = (await res.json()) as ApiResponse<unknown>;
    if (!json.ok) {
      setError(json.error.message);
      return;
    }
    await load();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending organizer requests</CardTitle>
        <CardDescription>Review and approve or reject applications.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <Alert variant="destructive">{error}</Alert>}
        {loading && <p className="text-sm text-zinc-500">Loading...</p>}
        {!loading && organizers.length === 0 && <p className="text-sm text-zinc-500">No pending requests.</p>}
        {organizers.map((o) => (
          <div key={o.userId} className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <div>
              <p className="font-medium">{o.organizationName}</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {o.fullName} · {o.email ?? "no email"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => act(o.userId, "approve")}>Approve</Button>
              <Button variant="outline" onClick={() => act(o.userId, "reject")}>
                Reject
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
