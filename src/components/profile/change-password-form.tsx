"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { changePasswordAction, type ProfileActionState } from "@/actions/profile.actions";
import { FormField } from "@/components/forms/form-field";
import { FormSection } from "@/components/forms/form-section";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

const initial: ProfileActionState = { ok: true };

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, initial);
  const lastNotified = useRef<string | null>(null);

  useEffect(() => {
    if (!state.message || state.message === lastNotified.current) return;
    lastNotified.current = state.message;

    if (state.ok) {
      toast.success(state.message);
      const form = document.getElementById("change-password-form") as HTMLFormElement | null;
      form?.reset();
    } else {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <form id="change-password-form" action={action} className="space-y-4" noValidate>
      {state.ok && state.message && (
        <Alert variant="success" role="status" aria-live="polite">
          {state.message}
        </Alert>
      )}
      {!state.ok && state.message && (
        <Alert variant="destructive" role="alert">
          {state.message}
        </Alert>
      )}

      <FormSection
        title="Change password"
        description="At least 10 characters with uppercase, lowercase, a number, and a symbol (e.g. ! @ #)."
      >
        <div className="grid max-w-md gap-4">
          <FormField
            id="currentPassword"
            label="Current password"
            required
            error={state.fieldErrors?.currentPassword?.[0]}
          >
            <PasswordInput id="currentPassword" name="currentPassword" required autoComplete="current-password" />
          </FormField>
          <FormField
            id="newPassword"
            label="New password"
            required
            error={state.fieldErrors?.newPassword?.[0]}
          >
            <PasswordInput id="newPassword" name="newPassword" required autoComplete="new-password" />
          </FormField>
          <FormField
            id="confirmPassword"
            label="Confirm new password"
            required
            error={state.fieldErrors?.confirmPassword?.[0]}
          >
            <PasswordInput id="confirmPassword" name="confirmPassword" required autoComplete="new-password" />
          </FormField>
        </div>
      </FormSection>

      <Button type="submit" disabled={pending} aria-busy={pending}>
        {pending ? "Updating..." : "Update password"}
      </Button>
    </form>
  );
}
