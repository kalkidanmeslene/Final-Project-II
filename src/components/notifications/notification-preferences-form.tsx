"use client";

import { useEffect, useState } from "react";
import { ApiClientError } from "@/lib/api/fetch-json";
import { useAuth } from "@/hooks/use-auth";
import { useNotificationMutations, useNotificationPreferences } from "@/hooks/use-notifications";
import { FormSection } from "@/components/forms/form-section";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-border p-4">
      <span>
        <span className="block font-medium">{label}</span>
        <span className="mt-1 block text-sm text-muted-foreground">{description}</span>
      </span>
      <input
        type="checkbox"
        className="mt-1 h-4 w-4"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

export function NotificationPreferencesForm() {
  const { user, loading: authLoading } = useAuth();
  const { data, isLoading, isError } = useNotificationPreferences(!!user && !authLoading);
  const { updatePreferences } = useNotificationMutations();
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pref = data?.preferences;

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(null), 3000);
    return () => clearTimeout(t);
  }, [success]);

  if (authLoading || isLoading) {
    return <Spinner label="Loading preferences" />;
  }

  if (!user) {
    return (
      <Alert variant="destructive" role="alert">
        Sign in to manage notification preferences.
      </Alert>
    );
  }

  if (isError || !pref) {
    return (
      <Alert variant="destructive" role="alert">
        Could not load notification preferences. Try refreshing the page.
      </Alert>
    );
  }

  async function save(patch: Parameters<typeof updatePreferences.mutateAsync>[0]) {
    setError(null);
    try {
      await updatePreferences.mutateAsync(patch);
      setSuccess("Preferences saved.");
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Could not save preferences.");
    }
  }

  const emailDisabled = !pref.emailEnabled;

  return (
    <FormSection title="Notification preferences" description="Choose how you receive updates from Hibir Events.">
      {success && <Alert>{success}</Alert>}
      {error && <Alert variant="destructive">{error}</Alert>}

      <div className="space-y-3">
        <ToggleRow
          label="In-app notifications"
          description="Show notifications in your notification center."
          checked={pref.inAppEnabled}
          onChange={(v) => void save({ inAppEnabled: v })}
        />
        <ToggleRow
          label="Email notifications"
          description="Receive emails when enabled and your account has an email address."
          checked={pref.emailEnabled}
          onChange={(v) => void save({ emailEnabled: v })}
        />
      </div>

      <div className="mt-8 space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">Email categories</h3>
        <ToggleRow
          label="Bookings"
          description="Confirmations and payment results."
          checked={pref.bookingEmail}
          disabled={emailDisabled}
          onChange={(v) => void save({ bookingEmail: v })}
        />
        <ToggleRow
          label="Reminders"
          description="Reminders before events you have tickets for."
          checked={pref.reminderEmail}
          disabled={emailDisabled}
          onChange={(v) => void save({ reminderEmail: v })}
        />
        <ToggleRow
          label="Event updates"
          description="Changes, postponements, and approvals."
          checked={pref.eventUpdateEmail}
          disabled={emailDisabled}
          onChange={(v) => void save({ eventUpdateEmail: v })}
        />
        <ToggleRow
          label="Cancellations"
          description="When events you booked are cancelled."
          checked={pref.cancellationEmail}
          disabled={emailDisabled}
          onChange={(v) => void save({ cancellationEmail: v })}
        />
        <ToggleRow
          label="Ticket transfers"
          description="When tickets are sent or received."
          checked={pref.transferEmail}
          disabled={emailDisabled}
          onChange={(v) => void save({ transferEmail: v })}
        />
        <ToggleRow
          label="Organizer announcements"
          description="Messages from organizers about events you attend."
          checked={pref.announcementEmail}
          disabled={emailDisabled}
          onChange={(v) => void save({ announcementEmail: v })}
        />
      </div>

      <div className="mt-8">
        <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Reminder timing (hours before event)</h3>
        <p className="mb-3 text-sm text-muted-foreground">Default: 24 hours and 2 hours before start.</p>
        <div className="flex flex-wrap gap-2">
          {[24, 12, 6, 2, 1].map((hours) => {
            const active = pref.reminderHoursBefore.includes(hours);
            return (
              <Button
                key={hours}
                type="button"
                size="sm"
                variant={active ? "primary" : "outline"}
                disabled={updatePreferences.isPending}
                onClick={() => {
                  const next = active
                    ? pref.reminderHoursBefore.filter((h) => h !== hours)
                    : [...pref.reminderHoursBefore, hours].sort((a, b) => b - a);
                  if (next.length === 0) return;
                  void save({ reminderHoursBefore: next });
                }}
              >
                {hours}h
              </Button>
            );
          })}
        </div>
      </div>
    </FormSection>
  );
}
