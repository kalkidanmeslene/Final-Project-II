"use client";

import { ProfileShell } from "@/components/layout/profile-shell";
import { NotificationPreferencesForm } from "@/components/notifications/notification-preferences-form";

export default function NotificationPreferencesPage() {
  return (
    <ProfileShell title="Notification preferences">
      <NotificationPreferencesForm />
    </ProfileShell>
  );
}
