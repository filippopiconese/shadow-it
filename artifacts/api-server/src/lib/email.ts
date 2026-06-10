import { db, usersTable, organizationsTable, type Organization } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

export interface EmailMessage {
  to: string | string[];
  subject: string;
  html: string;
}

// Vendor-managed sending via Resend's HTTPS API. Railway blocks outbound SMTP
// ports, so we cannot use nodemailer/SMTP from the app server — emails must go
// out over HTTPS. Alerts are sent from our own verified domain.
const RESEND_API_URL = "https://api.resend.com/emails";
const DEFAULT_FROM = "ShadowGuard Alerts <alerts@shadowit.micro-saas.it>";

function emailFrom(): string {
  return process.env.EMAIL_FROM?.trim() || DEFAULT_FROM;
}

/** True when the Resend API key is configured, i.e. alerts can be delivered. */
export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

/** Sends one email via Resend. Throws on misconfiguration or API failure. */
async function sendEmail(msg: EmailMessage): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Email provider not configured (RESEND_API_KEY missing).");
  }

  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: emailFrom(),
      to: Array.isArray(msg.to) ? msg.to : [msg.to],
      subject: msg.subject,
      html: msg.html,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend API error ${res.status}: ${detail.slice(0, 300)}`);
  }
}

/** Recipients for an org's alerts: explicit alertEmails, else all org users. */
async function recipientsFor(org: Organization): Promise<string[]> {
  if (org.alertEmails && org.alertEmails.trim()) {
    return org.alertEmails.split(",").map((e) => e.trim()).filter(Boolean);
  }
  const users = await db.select().from(usersTable).where(eq(usersTable.organizationId, org.id));
  return users.map((u) => u.email).filter(Boolean);
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
  if (!isEmailConfigured()) {
    logger.info({ orgId, count: apps.length }, "[email] provider not configured — alert not sent");
    return;
  }
  const [org] = await db.select().from(organizationsTable).where(eq(organizationsTable.id, orgId));
  if (!org) return;
  const recipients = await recipientsFor(org);
  if (recipients.length === 0) {
    logger.warn({ orgId }, "No recipients for high-risk alert");
    return;
  }
  try {
    await sendEmail({
      to: recipients,
      subject: `⚠️ ${apps.length} new high-risk app${apps.length > 1 ? "s" : ""} in ${org.domain}`,
      html: highRiskHtml(org.domain, apps),
    });
    logger.info({ to: recipients, orgId }, "High-risk alert email sent");
  } catch (err) {
    logger.error({ err, orgId }, "Failed to send high-risk alert email");
  }
}

/** Sends a test alert email to the org's recipients. Throws on failure. */
export async function sendTestEmail(orgId: number): Promise<void> {
  if (!isEmailConfigured()) throw new Error("Email alerts are not enabled on this deployment.");
  const [org] = await db.select().from(organizationsTable).where(eq(organizationsTable.id, orgId));
  if (!org) throw new Error("Organization not found");
  const recipients = await recipientsFor(org);
  if (recipients.length === 0) throw new Error("No recipients configured.");
  await sendEmail({
    to: recipients,
    subject: "ShadowGuard — test alert email",
    html: `<div style="font-family:sans-serif"><h2>✅ Email alerts are working</h2><p>This is a test alert from ShadowGuard for <strong>${escapeHtml(org.domain)}</strong>. High-risk app alerts will be delivered here.</p></div>`,
  });
  logger.info({ orgId, recipients }, "Test email sent");
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
