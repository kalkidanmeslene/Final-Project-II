import { env } from "@/lib/env";

export function emailFromAddress() {
  return env.EMAIL_FROM ?? env.SMTP_FROM;
}

export function smtpFromAddress() {
  return env.SMTP_FROM ?? env.EMAIL_FROM;
}

export function isSmtpConfigured() {
  return Boolean(env.SMTP_HOST?.trim() && env.SMTP_USER?.trim() && env.SMTP_PASS?.trim());
}

export function usesResendSandboxFrom(from: string) {
  return /@resend\.dev/i.test(from) || from.includes("onboarding@resend.dev");
}

const PUBLIC_MAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "icloud.com",
]);

function extractFromEmail(from: string) {
  const match = from.match(/<([^>]+)>/);
  return (match?.[1] ?? from).trim().toLowerCase();
}

/** Resend only sends from domains you verify in their dashboard — not @gmail.com etc. */
export function isResendCompatibleFrom(from: string) {
  if (usesResendSandboxFrom(from)) return false;
  const domain = extractFromEmail(from).split("@")[1];
  if (!domain) return false;
  return !PUBLIC_MAIL_DOMAINS.has(domain);
}

export function canDeliverToAnyRecipient(): boolean {
  if (!env.EMAIL_ENABLED) return false;
  if (isSmtpConfigured()) return true;
  const from = emailFromAddress() ?? "";
  return Boolean(env.RESEND_API_KEY && isResendCompatibleFrom(from));
}

/**
 * Pick provider that can reach arbitrary attendee addresses.
 * Gmail/public addresses require SMTP. Resend requires a verified custom domain.
 */
export function resolveEmailProvider(): "resend" | "smtp" | null {
  if (!env.EMAIL_ENABLED) return null;

  const from = emailFromAddress() ?? "";
  const preferred = env.EMAIL_PROVIDER ?? (isSmtpConfigured() ? "smtp" : "resend");

  if (isSmtpConfigured()) return "smtp";

  if (preferred === "resend" && env.RESEND_API_KEY && isResendCompatibleFrom(from)) {
    return "resend";
  }

  if (env.RESEND_API_KEY && isResendCompatibleFrom(from)) return "resend";

  return null;
}

export function resolveFromAddress(provider: "resend" | "smtp") {
  return provider === "smtp" ? (smtpFromAddress() ?? emailFromAddress()) : emailFromAddress();
}

/** Optional redirect only when explicitly testing locally without SMTP. */
export function resolveRecipient(to: string) {
  const override = env.EMAIL_DEV_OVERRIDE_TO;
  const isDev = process.env.NODE_ENV === "development";

  if (isDev && override && !isSmtpConfigured() && usesResendSandboxFrom(emailFromAddress() ?? "")) {
    if (to.toLowerCase() === override.toLowerCase()) {
      return { to, subjectPrefix: "", intendedTo: to };
    }
    return { to: override, subjectPrefix: `[dev → ${to}] `, intendedTo: to };
  }

  return { to, subjectPrefix: "", intendedTo: to };
}

export function logEmailConfigurationWarning() {
  if (!env.EMAIL_ENABLED) return;

  if (isSmtpConfigured()) return;

  const from = emailFromAddress() ?? "";
  if (usesResendSandboxFrom(from)) {
    console.error(
      "[email] Cannot send to attendees: Resend test sender (onboarding@resend.dev) only reaches your Resend login email. " +
        "Set SMTP_HOST, SMTP_USER, SMTP_PASS (Gmail app password) or verify a domain in Resend and update EMAIL_FROM.",
    );
    return;
  }

  if (!isSmtpConfigured() && !isResendCompatibleFrom(from)) {
    console.error(
      "[email] Cannot send to attendees: set SMTP_PASS (Gmail app password) for " +
        `${extractFromEmail(from) || "your sender"}, or verify your domain in Resend and use that address in EMAIL_FROM.`,
    );
    return;
  }

  if (!env.RESEND_API_KEY && !isSmtpConfigured()) {
    console.error("[email] EMAIL_ENABLED is true but no SMTP or Resend API key is configured.");
  }
}
