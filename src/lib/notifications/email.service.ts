import nodemailer from "nodemailer";
import { Resend } from "resend";
import type { NotificationType } from "@prisma/client";
import { env } from "@/lib/env";
import type { EmailAttachment, EmailTemplateContext } from "./notification.types";
import {
  buildBookingConfirmedEmail,
  buildEventCancelledEmail,
  buildEventPostponedEmail,
  buildEventReminderEmail,
  buildEventUpdatedEmail,
  buildNotificationEmail,
  buildOrganizerAnnouncementEmail,
  buildPasswordResetEmail,
} from "./email.templates";
import {
  canDeliverToAnyRecipient,
  emailFromAddress,
  isSmtpConfigured,
  logEmailConfigurationWarning,
  resolveEmailProvider,
  resolveFromAddress,
  resolveRecipient,
  smtpFromAddress,
  usesResendSandboxFrom,
} from "./email-delivery";

type ResendError = { message: string; name: string; statusCode: number | null };
type SendPayload = {
  to: string;
  from: string;
  subject: string;
  html: string;
  text: string;
  attachments?: EmailAttachment[];
};

logEmailConfigurationWarning();

function formatResendError(error: ResendError) {
  return `${error.name}: ${error.message}${error.statusCode ? ` (HTTP ${error.statusCode})` : ""}`;
}

let transporter: nodemailer.Transporter | null = null;
let resendClient: Resend | null = null;

function getTransporter() {
  if (!env.SMTP_HOST) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT ?? 587,
      secure: env.SMTP_SECURE ?? false,
      auth: { user: env.SMTP_USER!, pass: env.SMTP_PASS! },
    });
  }
  return transporter;
}

function getResend() {
  if (!env.RESEND_API_KEY) return null;
  if (!resendClient) resendClient = new Resend(env.RESEND_API_KEY);
  return resendClient;
}

function pickTemplate(type: NotificationType, ctx: EmailTemplateContext) {
  switch (type) {
    case "booking_confirmed":
      return buildBookingConfirmedEmail(ctx);
    case "event_reminder":
      return buildEventReminderEmail(ctx);
    case "organizer_announcement":
      return buildOrganizerAnnouncementEmail(ctx);
    case "event_updated":
      return buildEventUpdatedEmail(ctx);
    case "event_postponed":
      return buildEventPostponedEmail(ctx);
    case "event_cancelled":
      return buildEventCancelledEmail(ctx);
    default:
      return buildNotificationEmail(ctx);
  }
}

async function sendViaResend(args: SendPayload) {
  const resend = getResend();
  if (!resend) return { ok: false as const, error: "resend_not_configured" };

  const { error } = await resend.emails.send({
    from: args.from,
    to: args.to,
    subject: args.subject,
    html: args.html,
    text: args.text,
    attachments: args.attachments?.map((a) => ({
      filename: a.filename,
      content: a.content,
      contentType: "image/png",
      contentId: a.cid,
    })),
  });

  if (error) {
    const message = formatResendError(error);
    console.error("[email:resend]", message, { to: args.to });
    return { ok: false as const, error: message, statusCode: error.statusCode };
  }
  return { ok: true as const };
}

async function sendViaSmtp(args: SendPayload) {
  const mail = getTransporter();
  if (!mail) return { ok: false as const, error: "smtp_not_configured" };

  try {
    await mail.sendMail({
      from: args.from,
      to: args.to,
      subject: args.subject,
      text: args.text,
      html: args.html,
      attachments: args.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        cid: a.cid,
      })),
    });
    return { ok: true as const };
  } catch (e) {
    const message = e instanceof Error ? e.message : "send_failed";
    console.error("[email:smtp]", message, { to: args.to });
    return { ok: false as const, error: message };
  }
}

async function deliverEmail(payload: SendPayload, preferred: "resend" | "smtp") {
  let mode: "resend" | "smtp" = preferred;
  let result =
    preferred === "resend" ? await sendViaResend(payload) : await sendViaSmtp(payload);

  if (!result.ok && preferred === "resend" && isSmtpConfigured()) {
    console.info("[email] Resend failed; retrying via SMTP.");
    result = await sendViaSmtp({ ...payload, from: smtpFromAddress() ?? payload.from });
    if (result.ok) return { ...result, mode: "smtp" as const };
    mode = "smtp";
  }

  if (!result.ok && payload.attachments?.length) {
    console.info("[email] Retrying without QR attachments.");
    const withoutQrHtml = payload.html.replace(
      /<div style="margin:20px 0;padding:16px[\s\S]*?<\/div>/g,
      "",
    );
    const retryPayload = {
      ...payload,
      attachments: undefined,
      html: withoutQrHtml,
      text: `${payload.text}\n\n(Open the app to view your QR ticket(s).)`,
    };
    result = mode === "resend" ? await sendViaResend(retryPayload) : await sendViaSmtp(retryPayload);
    if (!result.ok && isSmtpConfigured()) {
      result = await sendViaSmtp({ ...retryPayload, from: smtpFromAddress() ?? payload.from });
      if (result.ok) return { ...result, mode: "smtp" as const };
    }
  }

  return { ...result, mode };
}

export async function sendTransactionalEmail(args: {
  to: string;
  subject: string;
  html: string;
  text: string;
  attachments?: EmailAttachment[];
}) {
  if (!env.EMAIL_ENABLED) {
    return { ok: true as const, mode: "disabled" as const };
  }

  const provider = resolveEmailProvider();
  const from = provider ? resolveFromAddress(provider) : null;

  if (!provider || !from) {
    const reason = usesResendSandboxFrom(emailFromAddress() ?? "")
      ? "resend_sandbox_requires_smtp"
      : "email_not_configured";
    console.error(`[email] Cannot send to ${args.to}: ${reason}`);
    return { ok: false as const, mode: "none" as const, error: reason };
  }

  if (!canDeliverToAnyRecipient()) {
    return { ok: false as const, mode: "none" as const, error: "email_delivery_not_configured" };
  }

  const recipient = resolveRecipient(args.to);
  const payload: SendPayload = {
    to: recipient.to,
    from,
    subject: `${recipient.subjectPrefix}${args.subject}`,
    html: args.html,
    text: args.text,
    attachments: args.attachments,
  };

  const result = await deliverEmail(payload, provider);
  if (!result.ok) {
    return {
      ok: false as const,
      mode: result.mode,
      error: result.error,
      deliveredTo: recipient.to,
      intendedTo: recipient.intendedTo,
    };
  }

  if (recipient.intendedTo !== recipient.to) {
    console.info(`[email] Dev redirect: intended ${recipient.intendedTo} → sent to ${recipient.to}`);
  } else {
    console.info(`[email] Sent "${args.subject}" to ${recipient.to} via ${result.mode}`);
  }

  return {
    ok: true as const,
    mode: result.mode,
    deliveredTo: recipient.to,
    intendedTo: recipient.intendedTo,
  };
}

export async function sendPasswordResetEmail(args: {
  to: string;
  userName: string;
  resetUrl: string;
}) {
  const template = buildPasswordResetEmail({
    userName: args.userName,
    resetUrl: args.resetUrl,
  });
  return sendTransactionalEmail({
    to: args.to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

export async function sendNotificationEmail(args: {
  to: string;
  type: NotificationType;
  context: EmailTemplateContext;
  attachments?: EmailAttachment[];
}) {
  const template = pickTemplate(args.type, args.context);
  return sendTransactionalEmail({
    to: args.to,
    subject: template.subject,
    html: template.html,
    text: template.text,
    attachments: args.attachments,
  });
}
