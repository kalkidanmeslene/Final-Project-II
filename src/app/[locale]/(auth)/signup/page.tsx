"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { registerAction, type AuthActionState } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Alert } from "@/components/ui/alert";
import { AuthPageHeader } from "@/components/auth/auth-page-header";
import { PolicyAgreement } from "@/components/legal/policy-agreement";

const initial: AuthActionState = { ok: true };

export default function SignupPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");
  const loginHref = nextPath
    ? `/login?next=${encodeURIComponent(nextPath)}`
    : "/login";
  const [state, action, pending] = useActionState(registerAction, initial);
  const values = state.values;

  return (
    <>
      <AuthPageHeader subtitleEn="Create your account" subtitleAm="መለያዎን ይፍጠሩ" />

      <div className="rounded-xl border border-border bg-card p-8 shadow-lg">
        {!state.ok && state.message && (
          <Alert variant="destructive" className="mb-4">
            {state.message}
          </Alert>
        )}

        <form key={state.formKey ?? 0} action={action} className="space-y-5">
          <input type="hidden" name="preferredLanguage" value={locale} />
          {nextPath && <input type="hidden" name="next" value={nextPath} />}
          <Input
            id="fullName"
            name="fullName"
            required
            defaultValue={values?.fullName}
            label={t("fullName")}
            placeholder={t("fullName")}
            error={state.fieldErrors?.fullName?.[0]}
          />

          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={values?.email}
            label={t("email")}
            placeholder="Email"
            error={state.fieldErrors?.email?.[0]}
          />

          <Input
            id="phoneNumber"
            name="phoneNumber"
            type="tel"
            defaultValue={values?.phoneNumber}
            label={t("phone")}
            placeholder="Enter phone number"
            error={state.fieldErrors?.phoneNumber?.[0]}
          />

          <PasswordInput
            id="password"
            name="password"
            required
            autoComplete="new-password"
            defaultValue={values?.password}
            label={t("password")}
            placeholder={t("createPassword")}
            error={state.fieldErrors?.password?.[0]}
          />

          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            required
            autoComplete="new-password"
            defaultValue={values?.confirmPassword}
            label={t("confirmPassword")}
            placeholder={t("confirmPasswordPlaceholder")}
            error={state.fieldErrors?.confirmPassword?.[0]}
          />

          <PolicyAgreement
            id="signup-terms"
            required
            className="flex items-start gap-2"
            showRefundInLabel={false}
            showNoRefundNotice={false}
          />

          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending ? t("signingIn") : t("createAccount")}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {t("organizerPrompt")}{" "}
          <Link href="/signup/organizer" className="font-semibold text-primary hover:underline">
            {t("organizerLink")}
          </Link>
        </p>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {t("hasAccount")}{" "}
          <Link href={loginHref} className="font-semibold text-primary hover:underline">
            {t("signIn")}
          </Link>
        </p>
      </div>
    </>
  );
}
