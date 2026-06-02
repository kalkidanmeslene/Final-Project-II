import type { OrganizerProfileInfo } from "@/lib/profile/profile.types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function OrganizerOrgCard({ organizer }: { organizer: OrganizerProfileInfo }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization</CardTitle>
        <CardDescription>Verification status: {organizer.status}</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Name</dt>
            <dd className="mt-1 text-sm">{organizer.organizationName}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Website</dt>
            <dd className="mt-1 text-sm">{organizer.organizationWebsite || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Address</dt>
            <dd className="mt-1 text-sm">{organizer.organizationAddress || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Phone</dt>
            <dd className="mt-1 text-sm">{organizer.organizationPhone || "—"}</dd>
          </div>
          {organizer.reviewNote && (
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Review note</dt>
              <dd className="mt-1 text-sm">{organizer.reviewNote}</dd>
            </div>
          )}
        </dl>
      </CardContent>
    </Card>
  );
}
