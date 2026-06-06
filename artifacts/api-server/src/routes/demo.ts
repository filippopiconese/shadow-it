import { Router, type IRouter } from "express";
import { db, organizationsTable, usersTable, subscriptionsTable, oauthAppsTable, scansTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { categorizeApp, scoreApp } from "../lib/risk";
import { DEMO_DOMAIN, DEMO_APPS } from "../lib/demo-data";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function daysAgoDate(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

// Public, production-safe demo. Lets a prospective Workspace admin evaluate the
// product on sandboxed sample data before connecting their real tenant.
// Everything here is scoped to the dedicated demo organisation — it never reads
// or touches any real customer's data. Mounted unless DEMO_ENABLED=false.
router.get("/demo/enabled", (_req, res): void => {
  res.json({ enabled: true });
});

router.post("/demo/login", async (req, res): Promise<void> => {
  try {
    let [org] = await db.select().from(organizationsTable).where(eq(organizationsTable.domain, DEMO_DOMAIN));

    if (!org) {
      // "mock-token" marks the org as connected; scans for the demo org always
      // use the mock provider (see scan-providers), so no real Google call is made.
      const inserted = await db
        .insert(organizationsTable)
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
        .values({ organizationId: org.id, googleId: "demo-admin", email: "admin@demo-acme.com", name: "Demo Admin", picture: null })
        .returning();
      user = inserted[0]!;
    }

    const [existingSub] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.organizationId, org.id));
    if (!existingSub) {
      await db.insert(subscriptionsTable).values({ organizationId: org.id, status: "active", currentPeriodEnd: daysAgoDate(-30) });
    } else {
      await db.update(subscriptionsTable).set({ status: "active", currentPeriodEnd: daysAgoDate(-30) }).where(eq(subscriptionsTable.id, existingSub.id));
    }

    // Reset and reseed so every demo session starts from a clean, deterministic state.
    await db.delete(oauthAppsTable).where(eq(oauthAppsTable.organizationId, org.id));
    await db.delete(scansTable).where(eq(scansTable.organizationId, org.id));

    for (const app of DEMO_APPS) {
      const { riskLevel, riskScore } = scoreApp(app.scopes, app.users.length);
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

    await db.insert(scansTable).values([
      { organizationId: org.id, status: "completed", appsFound: DEMO_APPS.length, newAppsFound: 5, startedAt: daysAgoDate(7), completedAt: daysAgoDate(7) },
      { organizationId: org.id, status: "completed", appsFound: DEMO_APPS.length, newAppsFound: 2, startedAt: daysAgoDate(1), completedAt: daysAgoDate(1) },
    ]);

    req.session.userId = user.id;
    req.session.organizationId = org.id;
    req.session.isDemo = true;
    req.session.save((err) => {
      if (err) {
        logger.error({ err }, "Demo login session save error");
        res.status(500).json({ error: "Session save failed" });
        return;
      }
      res.json({ success: true, redirect: "/dashboard" });
    });
  } catch (err) {
    logger.error({ err }, "Demo login failed");
    res.status(500).json({ error: String(err) });
  }
});

export default router;
