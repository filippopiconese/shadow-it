import nodemailer, { type Transporter } from "nodemailer";
import { db, usersTable, organizationsTable, type Organization } from "@workspace/db";
import { eq } from "drizzle-orm";
import { decryptSecret } from "./crypto";
import { logger } from "./logger";

export interface EmailMessage {
  to: string | string[];
  subject: string;
  html: string;
}

/**
 * Builds an SMTP transporter for an organization. Prefers the org's own SMTP
 * (so mail never routes through our infrastructure); falls back to a global
 * SMTP_* env config if set; otherwise returns null (caller logs instead).
 */
function buildTransporter(org: Organization): { transporter: Transporter; from: string } | null {
  if (org.smtpHost) {
    const transporter = nodemailer.createTransport({
      host: org.smtpHost,
      port: org.smtpPort ?? 587,
      secure: org.smtpSecure,
      auth: org.smtpUser ? { user: org.smtpUser, pass: decryptSecret(org.smtpPass) ?? "" } : undefined,
    });
    return { transporter, from: org.emailFrom ?? `ShadowGuard <${org.smtpUser ?? "noreply@" + org.domain}>` };
  }

  const envHost = process.env.SMTP_HOST;
  if (envHost) {
    const transporter = nodemailer.createTransport({
      host: envHost,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? "" } : undefined,
    });
    return { transporter, from: process.env.EMAIL_FROM ?? "ShadowGuard <noreply@shadowguard.app>" };
  }

  return null;
}

/** Recipients for an org's alerts: explicit alertEmails, else all org users. */
async function recipientsFor(org: Organization): Promise<string[]> {
  if (org.alertEmails && org.alertEmails.trim()) {
    return org.alertEmails.split(",").map((e) => e.trim()).filter(Boolean);
  }
  const users = await db.select().from(usersTable).where(eq(usersTable.organizationId, org.id));
  return users.map((u) => u.email).filter(Boolean);
}

/** Sends an email via the org's transporter, or logs it when SMTP is unset. */
async function sendForOrg(org: Organization, msg: EmailMessage): Promise<void> {
  const built = buildTransporter(org);
  if (!built) {
    logger.info({ to: msg.to, subject: msg.subject, orgId: org.id }, "[email] SMTP not configured — not sent (would send)");
    return;
  }
  await built.transporter.sendMail({ from: built.from, ...msg });
  logger.info({ to: msg.to, subject: msg.subject, orgId: org.id }, "Email sent");
}

export interface HighRiskApp {
  appName: string;
  riskScore: number;
  userCount: number;
}

function highRiskHtml(domain: string, apps: HighRiskApp[]): string {
  const rows = apps
    .map(
      (a) =>
        `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee">${escapeHtml(a.appName)}</td>` +
        `<td style="padding:6px 12px;border-bottom:1px solid #eee;color:#dc2626;font-weight:600">${a.riskScore}/100</td>` +
        `<td style="padding:6px 12px;border-bottom:1px solid #eee">${a.userCount}</td></tr>`,
    )
    .join("");
  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
      <h2 style="color:#0f172a">⚠️ ${apps.length} new high-risk app${apps.length > 1 ? "s" : ""} detected</h2>
      <p style="color:#475569">A scan of <strong>${escapeHtml(domain)}</strong> found newly authorized OAuth apps with high-risk permissions.</p>
      <table style="border-collapse:collapse;width:100%;margin:16px 0">
        <thead><tr style="text-align:left;color:#64748b;font-size:13px">
          <th style="padding:6px 12px">App</th><th style="padding:6px 12px">Risk</th><th style="padding:6px 12px">Users</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="color:#475569">Review them in your ShadowGuard dashboard.</p>
    </div>`;
}

/** Notifies an org's admins of newly discovered high-risk OAuth apps. */
export async function sendNewHighRiskAppsAlert(orgId: number, apps: HighRiskApp[]): Promise<void> {
  if (apps.length === 0) return;
  const [org] = await db.select().from(organizationsTable).where(eq(organizationsTable.id, orgId));
  if (!org) return;
  const recipients = await recipientsFor(org);
  if (recipients.length === 0) {
    logger.warn({ orgId }, "No recipients for high-risk alert");
    return;
  }
  await sendForOrg(org, {
    to: recipients,
    subject: `⚠️ ${apps.length} new high-risk app${apps.length > 1 ? "s" : ""} in ${org.domain}`,
    html: highRiskHtml(org.domain, apps),
  });
}

/** Sends a test alert email to verify an org's SMTP settings. Throws on failure. */
export async function sendTestEmail(orgId: number): Promise<void> {
  const [org] = await db.select().from(organizationsTable).where(eq(organizationsTable.id, orgId));
  if (!org) throw new Error("Organization not found");
  const built = buildTransporter(org);
  if (!built) throw new Error("No SMTP configured. Add your SMTP settings first.");
  const recipients = await recipientsFor(org);
  if (recipients.length === 0) throw new Error("No recipients configured.");
  await built.transporter.sendMail({
    from: built.from,
    to: recipients,
    subject: "ShadowGuard — test alert email",
    html: `<div style="font-family:sans-serif"><h2>✅ Your SMTP works</h2><p>This is a test alert from ShadowGuard for <strong>${escapeHtml(org.domain)}</strong>. High-risk app alerts will be delivered here.</p></div>`,
  });
  logger.info({ orgId, recipients }, "Test email sent");
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
