import { Router, type IRouter } from "express";
import { db, organizationsTable, usersTable, subscriptionsTable, oauthAppsTable, scansTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { categorizeApp, scoreApp } from "../lib/risk";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const DEMO_DOMAIN = "demo-acme.com";

// Realistic-looking OAuth apps an SMB would discover in a real scan. Risk is
// derived from the scopes via scoreApp() so the demo stays consistent with the
// production scoring logic.
const DEMO_APPS: Array<{
  clientId: string;
  appName: string;
  scopes: string[];
  users: string[];
  daysAgo: number;
}> = [
  {
    clientId: "100001.apps.googleusercontent.com",
    appName: "ChatGPT",
    scopes: ["openid", "email", "profile", "https://www.googleapis.com/auth/drive", "https://www.googleapis.com/auth/gmail.readonly"],
    users: ["marco.rossi@demo-acme.com", "giulia.bianchi@demo-acme.com", "luca.verdi@demo-acme.com", "sara.neri@demo-acme.com"],
    daysAgo: 2,
  },
  {
    clientId: "100002.apps.googleusercontent.com",
    appName: "Grammarly",
    scopes: ["openid", "email", "profile", "https://www.googleapis.com/auth/gmail.modify"],
    users: ["marco.rossi@demo-acme.com", "anna.galli@demo-acme.com"],
    daysAgo: 3,
  },
  {
    clientId: "100003.apps.googleusercontent.com",
    appName: "Zoom",
    scopes: ["openid", "email", "profile", "https://www.googleapis.com/auth/calendar"],
    users: ["marco.rossi@demo-acme.com", "giulia.bianchi@demo-acme.com", "luca.verdi@demo-acme.com", "sara.neri@demo-acme.com", "anna.galli@demo-acme.com", "paolo.conti@demo-acme.com"],
    daysAgo: 40,
  },
  {
    clientId: "100004.apps.googleusercontent.com",
    appName: "Slack",
    scopes: ["openid", "email", "profile", "https://www.googleapis.com/auth/calendar", "https://www.googleapis.com/auth/contacts"],
    users: ["marco.rossi@demo-acme.com", "giulia.bianchi@demo-acme.com", "luca.verdi@demo-acme.com"],
    daysAgo: 55,
  },
  {
    clientId: "100005.apps.googleusercontent.com",
    appName: "Notion",
    scopes: ["openid", "email", "profile", "https://www.googleapis.com/auth/drive.file"],
    users: ["sara.neri@demo-acme.com", "paolo.conti@demo-acme.com"],
    daysAgo: 12,
  },
  {
    clientId: "100006.apps.googleusercontent.com",
    appName: "Calendly",
    scopes: ["openid", "email", "profile", "https://www.googleapis.com/auth/calendar"],
    users: ["giulia.bianchi@demo-acme.com"],
    daysAgo: 5,
  },
  {
    clientId: "100007.apps.googleusercontent.com",
    appName: "Superhuman",
    scopes: ["openid", "email", "profile", "https://mail.google.com/", "https://www.googleapis.com/auth/contacts"],
    users: ["paolo.conti@demo-acme.com"],
    daysAgo: 1,
  },
  {
    clientId: "100008.apps.googleusercontent.com",
    appName: "Loom",
    scopes: ["openid", "email", "profile"],
    users: ["luca.verdi@demo-acme.com", "anna.galli@demo-acme.com"],
    daysAgo: 70,
  },
  {
    clientId: "100009.apps.googleusercontent.com",
    appName: "HubSpot",
    scopes: ["openid", "email", "profile", "https://www.googleapis.com/auth/gmail.send", "https://www.googleapis.com/auth/contacts"],
    users: ["marco.rossi@demo-acme.com", "giulia.bianchi@demo-acme.com"],
    daysAgo: 4,
  },
  {
    clientId: "100010.apps.googleusercontent.com",
    appName: "Some Random Photo Editor",
    scopes: ["openid", "email", "profile", "https://www.googleapis.com/auth/drive", "https://www.googleapis.com/auth/spreadsheets"],
    users: ["sara.neri@demo-acme.com"],
    daysAgo: 1,
  },
  {
    clientId: "100011.apps.googleusercontent.com",
    appName: "Trello",
    scopes: ["openid", "email", "profile"],
    users: ["luca.verdi@demo-acme.com", "paolo.conti@demo-acme.com", "anna.galli@demo-acme.com"],
    daysAgo: 90,
  },
];

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
        .values({ domain: DEMO_DOMAIN, name: "Acme Corp (Demo)" })
        .returning();
      org = inserted[0]!;
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

export default router;
