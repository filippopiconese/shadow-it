import { Router, type IRouter, type Request, type Response } from "express";
import { db, organizationsTable, type Organization } from "@workspace/db";
import { eq } from "drizzle-orm";
import { encryptSecret } from "../lib/crypto";
import { sendTestEmail } from "../lib/email";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function requireAuth(req: Request, res: Response): boolean {
  if (!req.session.organizationId) {
    res.status(401).json({ error: "Not authenticated" });
    return false;
  }
  return true;
}

function toEmailSettings(org: Organization) {
  return {
    smtpHost: org.smtpHost ?? null,
    smtpPort: org.smtpPort ?? null,
    smtpSecure: org.smtpSecure,
    smtpUser: org.smtpUser ?? null,
    emailFrom: org.emailFrom ?? null,
    alertEmails: org.alertEmails ?? null,
    hasPassword: Boolean(org.smtpPass),
  };
}

router.get("/settings/email", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;
  const [org] = await db.select().from(organizationsTable).where(eq(organizationsTable.id, req.session.organizationId!));
  if (!org) {
    res.status(404).json({ error: "Organization not found" });
    return;
  }
  res.json(toEmailSettings(org));
});

router.put("/settings/email", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;
  const orgId = req.session.organizationId!;
  const b = req.body as Record<string, unknown>;

  const str = (v: unknown): string | null => {
    const s = typeof v === "string" ? v.trim() : "";
    return s.length > 0 ? s : null;
  };

  const update: Partial<Organization> = {
    smtpHost: str(b.smtpHost),
    smtpPort: b.smtpPort != null && b.smtpPort !== "" ? Number(b.smtpPort) : null,
    smtpSecure: Boolean(b.smtpSecure),
    smtpUser: str(b.smtpUser),
    emailFrom: str(b.emailFrom),
    alertEmails: str(b.alertEmails),
  };

  // Only overwrite the stored password when a new non-empty one is provided.
  if (typeof b.smtpPass === "string" && b.smtpPass.length > 0) {
    update.smtpPass = encryptSecret(b.smtpPass);
  }

  const [org] = await db.update(organizationsTable).set(update).where(eq(organizationsTable.id, orgId)).returning();
  if (!org) {
    res.status(404).json({ error: "Organization not found" });
    return;
  }
  res.json(toEmailSettings(org));
});

router.post("/settings/email/test", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;
  try {
    await sendTestEmail(req.session.organizationId!);
    res.json({ success: true });
  } catch (err) {
    logger.warn({ err }, "Test email failed");
    res.status(400).json({ error: err instanceof Error ? err.message : "Failed to send test email" });
  }
});

export default router;
