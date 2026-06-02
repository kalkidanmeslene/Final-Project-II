"use client";

import Link from "next/link";
import { ProfileShell } from "@/components/layout/profile-shell";
import { ProfileViewCard } from "@/components/profile/profile-view-card";
import { OrganizerOrgCard } from "@/components/profile/organizer-org-card";
import { useProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export default function OrganizerProfilePage() {
  const { profile, isLoading, isError } = useProfile();

  return (
    <ProfileShell title="Organizer profile">
      {isLoading && <Spinner label="Loading profile" />}
      {isError && <p role="alert">Failed to load profile.</p>}
      {profile && (
        <div className="space-y-6">
          <ProfileViewCard profile={profile} title="Personal details" description="Your organizer account information." />
          {profile.organizer ? (
            <OrganizerOrgCard organizer={profile.organizer} />
          ) : (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              No organization on file.{" "}
              <Link href="/become-organizer" className="underline">
                Apply to become an organizer
              </Link>
            </p>
          )}
          <Link href="/profile/settings">
            <Button>Edit profile</Button>
          </Link>
        </div>
      )}
    </ProfileShell>
  );
}
