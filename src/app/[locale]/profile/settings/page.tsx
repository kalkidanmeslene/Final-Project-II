"use client";

import { ProfileShell } from "@/components/layout/profile-shell";
import { EditProfileForm } from "@/components/profile/edit-profile-form";
import { ChangePasswordForm } from "@/components/profile/change-password-form";

export default function ProfileSettingsPage() {
  return (
    <ProfileShell title="Account settings">
      <div className="space-y-10">
        <EditProfileForm />
        <ChangePasswordForm />
      </div>
    </ProfileShell>
  );
}
