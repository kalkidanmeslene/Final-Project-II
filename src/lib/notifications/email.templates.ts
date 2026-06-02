import { env } from "@/lib/env";
import type { EmailTemplateContext } from "./notification.types";

function layout(content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Hibir Events</title></head>
<body style="font-family:Inter,Arial,sans-serif;background:#f8fafc;padding:24px;color:#0f172a;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:24px;border:1px solid #e2e8f0;">
    <p style="margin:0 0 16px;font-size:14px;color:#64748b;">Hibir Events</p>
    ${content}
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
    <p style="margin:0;font-size:12px;color:#94a3b8;">You received this because of your notification preferences on Hibir Events.</p>
  </div>
</body>
</html>`;
}

function cta(href: string, label: string) {
  return `<p style="margin:24px 0 0;"><a href="${href}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:600;">${label}</a></p>`;
}

function ticketQrBlocks(ctx: EmailTemplateContext) {
  if (!ctx.tickets?.length) return "";
  return ctx.tickets
    .map(
      (t) => `
    <div style="margin:20px 0;padding:16px;border:1px solid #e2e8f0;border-radius:10px;text-align:center;">
      <p style="margin:0 0 4px;font-weight:600;">${t.ticketTypeName}</p>
      <p style="margin:0 0 12px;font-size:12px;color:#64748b;font-family:monospace;">${t.ticketCode}</p>
      <img src="cid:${t.qrCid}" alt="Check-in QR for ${t.ticketCode}" width="220" height="220" style="display:block;margin:0 auto;" />
      <p style="margin:12px 0 0;font-size:12px;color:#64748b;">Show this QR at the venue entrance.</p>
    </div>`,
    )
    .join("");
}

function scheduleBlock(schedule: NonNullable<EmailTemplateContext["eventSchedule"]>) {
  const rows: string[] = [];
  if (schedule.previousDateTime) {
    rows.push(
      `<tr><td style="padding:6px 12px 6px 0;color:#64748b;vertical-align:top;">Was</td><td style="padding:6px 0;line-height:1.5;">${schedule.previousDateTime}</td></tr>`,
    );
  }
  rows.push(
    `<tr><td style="padding:6px 12px 6px 0;color:#64748b;vertical-align:top;font-weight:600;">Now</td><td style="padding:6px 0;line-height:1.5;font-weight:600;">${schedule.dateTime}</td></tr>`,
  );
  const place =
    schedule.venue || schedule.location
      ? `<p style="margin:12px 0 0;line-height:1.5;">${[schedule.venue, schedule.location].filter(Boolean).join(" · ")}</p>`
      : "";
  const prevPlace =
    schedule.previousVenue || schedule.previousLocation
      ? `<p style="margin:4px 0 0;font-size:13px;color:#64748b;line-height:1.5;">Previously: ${[schedule.previousVenue, schedule.previousLocation].filter(Boolean).join(" · ")}</p>`
      : "";
  return `
    <table style="margin:16px 0;width:100%;border-collapse:collapse;background:#f8fafc;border-radius:8px;padding:12px;">
      <tbody>${rows.join("")}</tbody>
    </table>
    ${place}
    ${prevPlace}
    ${schedule.reason ? `<p style="margin:12px 0 0;font-size:14px;"><strong>Reason:</strong> ${schedule.reason}</p>` : ""}
  `;
}

export function buildNotificationEmail(ctx: EmailTemplateContext) {
  const subject = ctx.title;
  const text = `Hi ${ctx.userName},\n\n${ctx.body}\n\n— Hibir Events`;
  const html = layout(`
    <h1 style="margin:0 0 12px;font-size:20px;">${ctx.title}</h1>
    <p style="margin:0 0 8px;">Hi ${ctx.userName},</p>
    <p style="margin:0;line-height:1.6;">${ctx.body.replace(/\n/g, "<br />")}</p>
    ${ctx.eventSchedule ? scheduleBlock(ctx.eventSchedule) : ""}
    ${ctx.eventUrl ? cta(ctx.eventUrl, "View event") : ""}
    ${ctx.ticketsUrl ? cta(ctx.ticketsUrl, "View my tickets") : ""}
  `);
  return { subject, html, text };
}

export function buildBookingConfirmedEmail(ctx: EmailTemplateContext) {
  const subject = `Your tickets — ${ctx.eventTitle ?? "Hibir Events"}`;
  const qrNote =
    ctx.tickets && ctx.tickets.length > 0
      ? `\n\nYour check-in QR code(s) are attached to this email.`
      : "";
  const text = `Hi ${ctx.userName},\n\nYour booking is confirmed for ${ctx.eventTitle}.\n\n${ctx.body}${qrNote}\n\nView tickets: ${ctx.ticketsUrl ?? env.APP_BASE_URL}`;
  const html = layout(`
    <h1 style="margin:0 0 12px;font-size:20px;">Booking confirmed</h1>
    <p style="margin:0 0 8px;">Hi ${ctx.userName},</p>
    <p style="margin:0 0 12px;line-height:1.6;">Your tickets for <strong>${ctx.eventTitle}</strong> are ready. Present the QR code(s) below at check-in.</p>
    <p style="margin:0;line-height:1.6;">${ctx.body}</p>
    ${ticketQrBlocks(ctx)}
    ${ctx.ticketsUrl ? cta(ctx.ticketsUrl, "View all tickets online") : ""}
  `);
  return { subject, html, text };
}

export function buildEventReminderEmail(ctx: EmailTemplateContext) {
  const subject = `Reminder — ${ctx.eventTitle ?? "upcoming event"}`;
  const text = `Hi ${ctx.userName},\n\n${ctx.body}\n\nEvent: ${ctx.eventTitle}\n${ctx.eventUrl ?? ""}`;
  const html = layout(`
    <h1 style="margin:0 0 12px;font-size:20px;">Event reminder</h1>
    <p style="margin:0 0 8px;">Hi ${ctx.userName},</p>
    <p style="margin:0;line-height:1.6;">${ctx.body.replace(/\n/g, "<br />")}</p>
    ${ctx.eventUrl ? cta(ctx.eventUrl, "Event details") : ""}
  `);
  return { subject, html, text };
}

export function buildPasswordResetEmail(args: { userName: string; resetUrl: string }) {
  const subject = "Reset your Hibir Events password";
  const text = `Hi ${args.userName},\n\nReset your password using this link (expires in 1 hour):\n${args.resetUrl}\n\nIf you did not request this, ignore this email.\n\n— Hibir Events`;
  const html = layout(`
    <h1 style="margin:0 0 12px;font-size:20px;">Password reset</h1>
    <p style="margin:0 0 8px;">Hi ${args.userName},</p>
    <p style="margin:0 0 12px;line-height:1.6;">We received a request to reset your password. This link expires in one hour.</p>
    ${cta(args.resetUrl, "Reset password")}
    <p style="margin:16px 0 0;font-size:12px;color:#64748b;">If you did not request a reset, you can safely ignore this email.</p>
  `);
  return { subject, html, text };
}

export function buildOrganizerAnnouncementEmail(ctx: EmailTemplateContext) {
  const subject = ctx.title;
  const text = `Hi ${ctx.userName},\n\n${ctx.eventTitle ? `Update for ${ctx.eventTitle}:\n\n` : ""}${ctx.body}`;
  const html = layout(`
    <h1 style="margin:0 0 12px;font-size:20px;">${ctx.title}</h1>
    <p style="margin:0 0 8px;">Hi ${ctx.userName},</p>
    ${ctx.eventTitle ? `<p style="margin:0 0 12px;color:#64748b;">Regarding <strong>${ctx.eventTitle}</strong></p>` : ""}
    <p style="margin:0;line-height:1.6;white-space:pre-line;">${ctx.body}</p>
    ${ctx.eventUrl ? cta(ctx.eventUrl, "View event") : ""}
  `);
  return { subject, html, text };
}

export function buildEventUpdatedEmail(ctx: EmailTemplateContext) {
  const subject = `Event updated — ${ctx.eventTitle ?? "your event"}`;
  const text = `Hi ${ctx.userName},\n\n${ctx.eventTitle} has been updated.\n\n${ctx.body}\n\n${ctx.eventUrl ?? ""}`;
  const html = layout(`
    <h1 style="margin:0 0 12px;font-size:20px;">Event details changed</h1>
    <p style="margin:0 0 8px;">Hi ${ctx.userName},</p>
    <p style="margin:0 0 12px;line-height:1.6;">The organizer updated <strong>${ctx.eventTitle}</strong>. Please review the new details.</p>
    <p style="margin:0;line-height:1.6;white-space:pre-line;">${ctx.body}</p>
    ${ctx.eventSchedule ? scheduleBlock(ctx.eventSchedule) : ""}
    ${ctx.eventUrl ? cta(ctx.eventUrl, "View updated event") : ""}
    ${ctx.ticketsUrl ? cta(ctx.ticketsUrl, "My tickets") : ""}
  `);
  return { subject, html, text };
}

export function buildEventPostponedEmail(ctx: EmailTemplateContext) {
  const subject = `Event rescheduled — ${ctx.eventTitle ?? "your event"}`;
  const text = `Hi ${ctx.userName},\n\n${ctx.eventTitle} has been rescheduled.\n\n${ctx.body}\n\n${ctx.eventUrl ?? ""}`;
  const html = layout(`
    <h1 style="margin:0 0 12px;font-size:20px;">Event rescheduled</h1>
    <p style="margin:0 0 8px;">Hi ${ctx.userName},</p>
    <p style="margin:0 0 12px;line-height:1.6;"><strong>${ctx.eventTitle}</strong> has a new date or time.</p>
    <p style="margin:0;line-height:1.6;white-space:pre-line;">${ctx.body}</p>
    ${ctx.eventSchedule ? scheduleBlock(ctx.eventSchedule) : ""}
    ${ctx.eventUrl ? cta(ctx.eventUrl, "View event") : ""}
    ${ctx.ticketsUrl ? cta(ctx.ticketsUrl, "My tickets") : ""}
  `);
  return { subject, html, text };
}

export function buildEventCancelledEmail(ctx: EmailTemplateContext) {
  const subject = `Event cancelled — ${ctx.eventTitle ?? "your event"}`;
  const text = `Hi ${ctx.userName},\n\n${ctx.eventTitle} has been cancelled.\n\n${ctx.body}\n\n${ctx.ticketsUrl ?? env.APP_BASE_URL}`;
  const html = layout(`
    <h1 style="margin:0 0 12px;font-size:20px;">Event cancelled</h1>
    <p style="margin:0 0 8px;">Hi ${ctx.userName},</p>
    <p style="margin:0 0 12px;line-height:1.6;"><strong>${ctx.eventTitle}</strong> will no longer take place.</p>
    <p style="margin:0;line-height:1.6;white-space:pre-line;">${ctx.body}</p>
    ${ctx.ticketsUrl ? cta(ctx.ticketsUrl, "View my tickets") : ""}
  `);
  return { subject, html, text };
}
