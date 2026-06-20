import { Router, type IRouter, type Request, type Response } from "express";
import { db, oauthAppsTable, scansTable, organizationsTable } from "@workspace/db";
import { eq, ne, and, sql, desc } from "drizzle-orm";

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

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  // Dashboard reflects currently-authorized apps; revoked ones are excluded.
  // Counts are computed in SQL (filtered aggregates) rather than loading rows.
  const activeApps = and(eq(oauthAppsTable.organizationId, orgId), ne(oauthAppsTable.status, "removed"));
  const [agg] = await db
    .select({
      totalApps: sql<number>`count(*)::int`,
      highRiskApps: sql<number>`(count(*) filter (where ${oauthAppsTable.riskLevel} = 'high'))::int`,
      mediumRiskApps: sql<number>`(count(*) filter (where ${oauthAppsTable.riskLevel} = 'medium'))::int`,
      lowRiskApps: sql<number>`(count(*) filter (where ${oauthAppsTable.riskLevel} = 'low'))::int`,
      dismissedApps: sql<number>`(count(*) filter (where ${oauthAppsTable.isDismissed}))::int`,
      newAppsThisWeek: sql<number>`(count(*) filter (where ${oauthAppsTable.firstSeenAt} > ${oneWeekAgo}))::int`,
    })
    .from(oauthAppsTable)
    .where(activeApps);

  // Distinct users across non-removed apps (text[] column → unnest).
  const usersResult = await db.execute(sql`
    SELECT count(DISTINCT u)::int AS total
    FROM ${oauthAppsTable}, unnest(${oauthAppsTable.authorizedUsers}) AS u
    WHERE ${oauthAppsTable.organizationId} = ${orgId} AND ${oauthAppsTable.status} <> 'removed'
  `);
  const totalUsers = Number((usersResult.rows[0] as { total?: number } | undefined)?.total ?? 0);

  const [lastScan] = await db
    .select()
    .from(scansTable)
    .where(and(eq(scansTable.organizationId, orgId), eq(scansTable.status, "completed")))
    .orderBy(desc(scansTable.completedAt))
    .limit(1);

  res.json({
    totalApps: Number(agg?.totalApps ?? 0),
    highRiskApps: Number(agg?.highRiskApps ?? 0),
    mediumRiskApps: Number(agg?.mediumRiskApps ?? 0),
    lowRiskApps: Number(agg?.lowRiskApps ?? 0),
    newAppsThisWeek: Number(agg?.newAppsThisWeek ?? 0),
    dismissedApps: Number(agg?.dismissedApps ?? 0),
    lastScanAt: lastScan?.completedAt?.toISOString() ?? null,
    totalUsers,
    // Total users in the workspace/tenant at the last scan (coverage proof).
    directoryUsers: lastScan?.usersFound ?? null,
  });
});

// On-demand roster of every user seen in the directory at the last scan. Kept
// out of the summary so the default dashboard stays light.
router.get("/dashboard/directory-users", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;
  const orgId = req.session.organizationId!;
  const [org] = await db.select().from(organizationsTable).where(eq(organizationsTable.id, orgId));
  res.json({ users: org?.directoryUsers ?? [] });
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
