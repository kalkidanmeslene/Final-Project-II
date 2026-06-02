"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Alert } from "@/components/ui/alert";
import { AuthPageHeader } from "@/components/auth/auth-page-header";
import { useAuth } from "@/hooks/use-auth";
import { defaultDashboardPath } from "@/lib/auth/rbac";

export function LoginForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const params = useSearchParams();
  const { login, error, setError } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const nextPath = params.get("next");
  const signupHref = nextPath
    ? `/signup?next=${encodeURIComponent(nextPath)}`
    : "/signup";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const result = await login(String(fd.get("identifier")), String(fd.get("password")));
    setSubmitting(false);
    if (result.ok && result.user) {
      const next = params.get("next");
      if (next && next.startsWith("/") && !next.startsWith("//")) {
        router.push(next);
      } else {
        router.push(defaultDashboardPath(result.user.role, result.user.status));
      }
    }
  }

  return (
    <>
      <AuthPageHeader subtitleEn="Sign in to your account" subtitleAm="ወደ መለያዎ ይግቡ" />

      <div className="rounded-xl border border-border bg-card p-8 shadow-lg">
        {params.get("registered") === "organizer" && (
          <Alert className="mb-4 border-primary/30 bg-primary/5">
            Organizer account created. Sign in — you will see the pending approval screen until an admin
            approves you.
          </Alert>
        )}
        {params.get("registered") === "1" && (
          <Alert className="mb-4 border-green-500/30 bg-green-200">Account created. Please sign in.</Alert>
        )}
        {error && (
          <Alert variant="destructive" className="mb-4">
            {error}
          </Alert>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
          <Input
            id="identifier"
            name="identifier"
            required
            autoComplete="username"
            label={t("emailOrPhone")}
            placeholder={t("emailOrPhonePlaceholder")}
          />

          <PasswordInput
            id="password"
            name="password"
            required
            autoComplete="current-password"
            label={t("password")}
            placeholder={t("passwordPlaceholder")}
          />

          <div className="flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-muted-foreground">{t("rememberMe")}</span>
            </label>
            <Link href="/forgot-password" className="text-sm text-primary hover:underline">
              {t("forgotPassword")}
            </Link>
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? t("signingIn") : t("signIn")}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t("noAccount")}{" "}
          <Link href={signupHref} className="font-semibold text-primary hover:underline">
            {t("signUp")}
          </Link>
        </p>
      </div>
    </>
  );
}
