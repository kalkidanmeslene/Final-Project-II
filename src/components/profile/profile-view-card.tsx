import type { UserProfile } from "@/lib/profile/profile.types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileAvatar } from "./profile-avatar";

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">{value || "—"}</dd>
    </div>
  );
}

export function ProfileViewCard({ profile, title, description }: { profile: UserProfile; title: string; description?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-6">
        <ProfileAvatar name={profile.fullName} imageUrl={profile.profilePictureUrl} editable={false} />
        <dl className="grid gap-4 sm:grid-cols-2">
          <Detail label="Full name" value={profile.fullName} />
          <Detail label="Email" value={profile.email} />
          <Detail label="Phone" value={profile.phoneNumber} />
          <Detail label="Language" value={profile.preferredLanguage} />
          <Detail label="Role" value={profile.role} />
          <Detail label="Account status" value={profile.status} />
          {profile.bio && (
            <div className="sm:col-span-2">
              <Detail label="Bio" value={profile.bio} />
            </div>
          )}
        </dl>
      </CardContent>
    </Card>
  );
}
