"use client";

import Link from "next/link";
import { ProfileShell } from "@/components/layout/profile-shell";
import { ProfileViewCard } from "@/components/profile/profile-view-card";
import { useProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

export default function AdminProfilePage() {
  const { profile, isLoading, isError } = useProfile();

  return (
    <ProfileShell title="Admin profile">
      {isLoading && <Spinner label="Loading profile" />}
      {isError && <p role="alert">Failed to load profile.</p>}
      {profile && (
        <div className="space-y-6">
          <ProfileViewCard profile={profile} title="Administrator" description="Platform administrator account." />
          <Card>
            <CardHeader>
              <CardTitle>Admin tools</CardTitle>
              <CardDescription>Quick links for platform management.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Link href="/dashboard/admin">
                <Button variant="outline">Admin dashboard</Button>
              </Link>
              <Link href="/profile/settings">
                <Button>Edit profile</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}
    </ProfileShell>
  );
}
