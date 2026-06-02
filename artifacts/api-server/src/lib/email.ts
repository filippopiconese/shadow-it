import nodemailer, { type Transporter } from "nodemailer";
import { db, usersTable, organizationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

// `null` = not yet resolved, `undefined` = resolved but no SMTP configured.
let cachedTransporter: Transporter | null | undefined = null;

function getTransporter(): Transporter | undefined {
  if (cachedTransporter !== null) return cachedTransporter;

  const host = process.env.SMTP_HOST;
  if (!host) {
    cachedTransporter = undefined;
    return undefined;
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? "" }
      : undefined,
  });
  return cachedTransporter;
}

export interface EmailMessage {
  to: string | string[];
  subject: string;
  html: string;
}

/**
 * Sends an email when SMTP is configured (SMTP_HOST). Without SMTP it logs the
 * message instead, so the alert pipeline is fully exercisable in dev without
 * credentials.
 */
export async function sendEmail({ to, subject, html }: EmailMessage): Promise<void> {
  const from = process.env.EMAIL_FROM ?? "ShadowGuard <noreply@shadowguard.app>";
  const transporter = getTransporter();

  if (!transporter) {
    logger.info({ to, subject }, "[email:dev] SMTP not configured — email not sent (would send)");
    return;
  }

  await transporter.sendMail({ from, to, subject, html });
  logger.info({ to, subject }, "Email sent");
}

export interface HighRiskApp {
  appName: string;
  riskScore: number;
  userCount: number;
}

/**
 * Notifies an organization's admins that the latest scan surfaced new high-risk
 * OAuth apps.
 */
export async function sendNewHighRiskAppsAlert(orgId: number, apps: HighRiskApp[]): Promise<void> {
  if (apps.length === 0) return;

  const [org] = await db.select().from(organizationsTable).where(eq(organizationsTable.id, orgId));
  const recipients = (await db.select().from(usersTable).where(eq(usersTable.organizationId, orgId)))
    .map((u) => u.email)
    .filter(Boolean);

  if (recipients.length === 0) {
    logger.warn({ orgId }, "No recipients for high-risk alert");
    return;
  }

  const rows = apps
    .map(
      (a) =>
        `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee">${escapeHtml(a.appName)}</td>` +
        `<td style="padding:6px 12px;border-bottom:1px solid #eee;color:#dc2626;font-weight:600">${a.riskScore}/100</td>` +
        `<td style="padding:6px 12px;border-bottom:1px solid #eee">${a.userCount}</td></tr>`,
    )
    .join("");

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
      <h2 style="color:#0f172a">⚠️ ${apps.length} new high-risk app${apps.length > 1 ? "s" : ""} detected</h2>
      <p style="color:#475569">A scan of <strong>${escapeHtml(org?.domain ?? "your workspace")}</strong> found newly authorized OAuth apps with high-risk permissions.</p>
      <table style="border-collapse:collapse;width:100%;margin:16px 0">
        <thead><tr style="text-align:left;color:#64748b;font-size:13px">
          <th style="padding:6px 12px">App</th><th style="padding:6px 12px">Risk</th><th style="padding:6px 12px">Users</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="color:#475569">Review them in your ShadowGuard dashboard.</p>
    </div>`;

  await sendEmail({
    to: recipients,
    subject: `⚠️ ${apps.length} new high-risk app${apps.length > 1 ? "s" : ""} in ${org?.domain ?? "your workspace"}`,
    html,
  });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
