import { Router, type IRouter, type Request, type Response } from "express";
import { db, oauthAppsTable, scansTable } from "@workspace/db";
import { eq, and, sql, desc } from "drizzle-orm";

const router: IRouter = Router();

function requireAuth(req: Request, res: Response): boolean {
  if (!req.session.organizationId) {
    res.status(401).json({ error: "Not authenticated" });
    return false;
  }
  return true;
}

router.get("/dashboard/summary", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;
  const orgId = req.session.organizationId!;

  const allApps = await db
    .select()
    .from(oauthAppsTable)
    .where(eq(oauthAppsTable.organizationId, orgId));

  // Dashboard reflects currently-authorized apps; revoked ones are excluded.
  const apps = allApps.filter((a) => a.status !== "removed");

  const totalApps = apps.length;
  const highRiskApps = apps.filter((a) => a.riskLevel === "high").length;
  const mediumRiskApps = apps.filter((a) => a.riskLevel === "medium").length;
  const lowRiskApps = apps.filter((a) => a.riskLevel === "low").length;
  const dismissedApps = apps.filter((a) => a.isDismissed).length;

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const newAppsThisWeek = apps.filter((a) => a.firstSeenAt > oneWeekAgo).length;

  const allUsers = new Set<string>();
  for (const app of apps) {
    for (const u of app.authorizedUsers ?? []) allUsers.add(u);
  }

  const [lastScan] = await db
    .select()
    .from(scansTable)
    .where(and(eq(scansTable.organizationId, orgId), eq(scansTable.status, "completed")))
    .orderBy(desc(scansTable.completedAt))
    .limit(1);

  res.json({
    totalApps,
    highRiskApps,
    mediumRiskApps,
    lowRiskApps,
    newAppsThisWeek,
    dismissedApps,
    lastScanAt: lastScan?.completedAt?.toISOString() ?? null,
    totalUsers: allUsers.size,
  });
});

router.get("/dashboard/new-apps", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;
  const orgId = req.session.organizationId!;

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const apps = await db
    .select()
    .from(oauthAppsTable)
    .where(and(eq(oauthAppsTable.organizationId, orgId), sql`${oauthAppsTable.firstSeenAt} > ${oneWeekAgo}`))
    .orderBy(sql`${oauthAppsTable.riskScore} DESC`)
    .limit(10);

  res.json(
    apps.map((a) => ({
      id: a.id,
      clientId: a.clientId,
      appName: a.appName,
      category: a.category,
      riskLevel: a.riskLevel,
      riskScore: a.riskScore,
      userCount: (a.authorizedUsers ?? []).length,
      scopes: a.scopes ?? [],
      isDismissed: a.isDismissed,
      firstSeenAt: a.firstSeenAt.toISOString(),
      lastSeenAt: a.lastSeenAt.toISOString(),
      iconUrl: a.iconUrl ?? null,
    })),
  );
});

export default router;
