import { Router, type IRouter } from "express";
import { db, organizationsTable, usersTable, subscriptionsTable, oauthAppsTable, scansTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { categorizeApp, scoreApp } from "../lib/risk";
import { runDueScans } from "../lib/scheduler";
import { sendNewHighRiskAppsAlert } from "../lib/email";
import { DEMO_DOMAIN, DEMO_APPS } from "../lib/demo-data";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function daysAgoDate(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

// Seeds a demo organization with realistic OAuth apps + scan history, then logs
// the current session in as the demo admin. Dev/staging only — never mounted in
// production (see routes/index.ts).
router.post("/dev/login", async (req, res): Promise<void> => {
  try {
    let [org] = await db.select().from(organizationsTable).where(eq(organizationsTable.domain, DEMO_DOMAIN));

    if (!org) {
      const inserted = await db
        .insert(organizationsTable)
        // Fake token marks the org as "connected" so Run Scan + the scheduler
        // work with the mock provider (SCAN_PROVIDER=mock).
        .values({ domain: DEMO_DOMAIN, name: "Acme Corp (Demo)", accessToken: "mock-token" })
        .returning();
      org = inserted[0]!;
    } else if (!org.accessToken) {
      await db.update(organizationsTable).set({ accessToken: "mock-token" }).where(eq(organizationsTable.id, org.id));
    }

    let [user] = await db.select().from(usersTable).where(eq(usersTable.googleId, "demo-admin"));
    if (!user) {
      const inserted = await db
        .insert(usersTable)
        .values({
          organizationId: org.id,
          googleId: "demo-admin",
          email: "admin@demo-acme.com",
          name: "Demo Admin",
          picture: null,
        })
        .returning();
      user = inserted[0]!;
    }

    const [existingSub] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.organizationId, org.id));
    if (!existingSub) {
      await db.insert(subscriptionsTable).values({
        organizationId: org.id,
        status: "active",
        currentPeriodEnd: daysAgoDate(-30),
      });
    } else {
      await db.update(subscriptionsTable).set({ status: "active", currentPeriodEnd: daysAgoDate(-30) }).where(eq(subscriptionsTable.id, existingSub.id));
    }

    // Reset and reseed apps so the demo is deterministic on every login.
    await db.delete(oauthAppsTable).where(eq(oauthAppsTable.organizationId, org.id));
    await db.delete(scansTable).where(eq(scansTable.organizationId, org.id));

    for (const app of DEMO_APPS) {
      const { riskLevel, riskScore } = scoreApp(app.scopes);
      await db.insert(oauthAppsTable).values({
        organizationId: org.id,
        clientId: app.clientId,
        appName: app.appName,
        category: categorizeApp(app.appName),
        riskLevel,
        riskScore,
        scopes: app.scopes,
        authorizedUsers: app.users,
        iconUrl: app.iconUrl,
        firstSeenAt: daysAgoDate(app.daysAgo),
        lastSeenAt: daysAgoDate(0),
      });
    }

    // A bit of scan history, most recent completed.
    await db.insert(scansTable).values([
      { organizationId: org.id, status: "completed", appsFound: DEMO_APPS.length, newAppsFound: 5, startedAt: daysAgoDate(7), completedAt: daysAgoDate(7) },
      { organizationId: org.id, status: "completed", appsFound: DEMO_APPS.length, newAppsFound: 2, startedAt: daysAgoDate(1), completedAt: daysAgoDate(1) },
    ]);

    req.session.userId = user.id;
    req.session.organizationId = org.id;
    req.session.save((err) => {
      if (err) {
        logger.error({ err }, "Dev login session save error");
        res.status(500).json({ error: "Session save failed" });
        return;
      }
      res.json({ success: true, redirect: "/dashboard" });
    });
  } catch (err) {
    logger.error({ err }, "Dev login failed");
    res.status(500).json({ error: String(err) });
  }
});

// Manually trigger the scheduler tick (dev only).
router.post("/dev/run-scheduler", async (_req, res): Promise<void> => {
  const result = await runDueScans();
  res.json(result);
});

// Fire a sample high-risk alert for the logged-in org (dev only). Useful to
// verify the email pipeline without running a real scan.
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

export default router;
