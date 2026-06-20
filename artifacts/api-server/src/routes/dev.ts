import { Router, type IRouter } from "express";
import { db, organizationsTable, usersTable, subscriptionsTable, oauthAppsTable } from "@workspace/db";
import { runDueScans } from "../lib/scheduler";
import { sendNewHighRiskAppsAlert } from "../lib/email";

const router: IRouter = Router();

// Powerful, NON-production-only endpoints (mounted only when NODE_ENV !==
// "production"). The public demo lives in routes/demo.ts instead.

// Manually trigger the scheduler tick (scans every connected org).
router.post("/dev/run-scheduler", async (_req, res): Promise<void> => {
  const result = await runDueScans();
  res.json(result);
});

// Fire a sample high-risk alert for the logged-in org (verifies the email pipeline).
router.post("/dev/test-alert", async (req, res): Promise<void> => {
  if (!req.session.organizationId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  await sendNewHighRiskAppsAlert(req.session.organizationId, [
    { appName: "Some Random Photo Editor", riskScore: 95, userCount: 1 },
  ]);
  res.json({ success: true });
});

// Creates a fresh, isolated tenant (org + user + one uniquely-named app) for the
// tenant-isolation test. Returns the new ids.
router.post("/dev/seed-tenant", async (_req, res): Promise<void> => {
  const tag = Math.random().toString(36).slice(2, 8);
  const domain = `tenant-${tag}.test`;
  const [org] = await db
    .insert(organizationsTable)
    .values({ domain, name: `Tenant ${tag}`, accessToken: "mock-token" })
    .returning();
  const [user] = await db
    .insert(usersTable)
    .values({ organizationId: org!.id, externalId: `user-${tag}`, email: `admin@${domain}`, name: `Admin ${tag}` })
    .returning();
  await db.insert(subscriptionsTable).values({ organizationId: org!.id, status: "active" });
  const appName = `Private App ${tag}`;
  const [app] = await db
    .insert(oauthAppsTable)
    .values({
      organizationId: org!.id,
      clientId: `${tag}.apps.googleusercontent.com`,
      appName,
      scopes: ["openid", "email", "profile"],
      authorizedUsers: [`admin@${domain}`],
    })
    .returning();
  res.json({ orgId: org!.id, userId: user!.id, appId: app!.id, appName, domain });
});

// Logs the session in as an arbitrary org/user (test helper).
router.post("/dev/login-as", (req, res): void => {
  const { organizationId, userId } = req.body as { organizationId?: number; userId?: number };
  if (!organizationId || !userId) {
    res.status(400).json({ error: "organizationId and userId required" });
    return;
  }
  req.session.userId = userId;
  req.session.organizationId = organizationId;
  req.session.save(() => res.json({ success: true }));
});

export default router;
