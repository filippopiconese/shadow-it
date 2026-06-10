import { Router, type IRouter, type Request, type Response } from "express";
import { db, organizationsTable, type Organization } from "@workspace/db";
import { eq } from "drizzle-orm";
import { sendTestEmail, isEmailConfigured } from "../lib/email";
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
    alertEmails: org.alertEmails ?? null,
    senderConfigured: isEmailConfigured(),
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
    alertEmails: str(b.alertEmails),
  };

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
