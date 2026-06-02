import { Router, type IRouter, type Request, type Response } from "express";
import { db, scansTable, oauthAppsTable, organizationsTable, subscriptionsTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { scanWorkspaceApps, categorizeAndScore } from "../lib/google";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function requireAuth(req: Request, res: Response): boolean {
  if (!req.session.organizationId) {
    res.status(401).json({ error: "Not authenticated" });
    return false;
  }
  return true;
}

router.get("/scans", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;
  const orgId = req.session.organizationId!;

  const scans = await db
    .select()
    .from(scansTable)
    .where(eq(scansTable.organizationId, orgId))
    .orderBy(desc(scansTable.startedAt))
    .limit(20);

  res.json(
    scans.map((s) => ({
      id: s.id,
      status: s.status,
      appsFound: s.appsFound ?? null,
      newAppsFound: s.newAppsFound ?? null,
      startedAt: s.startedAt.toISOString(),
      completedAt: s.completedAt?.toISOString() ?? null,
      errorMessage: s.errorMessage ?? null,
    })),
  );
});

router.post("/scans/trigger", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;
  const orgId = req.session.organizationId!;

  const [sub] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.organizationId, orgId));
  const now = new Date();
  const canScan =
    sub?.status === "active" ||
    (sub?.status === "trial" && sub.trialEndsAt != null && sub.trialEndsAt > now);

  if (!canScan) {
    res.status(402).json({ error: "Subscription required to run scans" });
    return;
  }

  const [org] = await db.select().from(organizationsTable).where(eq(organizationsTable.id, orgId));
  if (!org?.accessToken) {
    res.status(400).json({ error: "Google Workspace not connected" });
    return;
  }

  const [scan] = await db
    .insert(scansTable)
    .values({ organizationId: orgId, status: "running" })
    .returning();

  if (!scan) {
    res.status(500).json({ error: "Failed to create scan" });
    return;
  }

  res.json({
    id: scan.id,
    status: scan.status,
    appsFound: null,
    newAppsFound: null,
    startedAt: scan.startedAt.toISOString(),
    completedAt: null,
    errorMessage: null,
  });

  setImmediate(async () => {
    try {
      const discovered = await scanWorkspaceApps(org.accessToken!, org.refreshToken ?? "");

      let appsFound = 0;
      let newAppsFound = 0;

      for (const app of discovered) {
        const { category, riskLevel, riskScore } = categorizeAndScore(app);

        const [existing] = await db
          .select()
          .from(oauthAppsTable)
          .where(and(eq(oauthAppsTable.clientId, app.clientId), eq(oauthAppsTable.organizationId, orgId)));

        if (existing) {
          await db
            .update(oauthAppsTable)
            .set({
              appName: app.appName,
              scopes: app.scopes,
              authorizedUsers: app.authorizedUsers,
              riskLevel,
              riskScore,
              category,
              lastSeenAt: new Date(),
            })
            .where(eq(oauthAppsTable.id, existing.id));
        } else {
          await db.insert(oauthAppsTable).values({
            organizationId: orgId,
            clientId: app.clientId,
            appName: app.appName,
            scopes: app.scopes,
            authorizedUsers: app.authorizedUsers,
            riskLevel,
            riskScore,
            category,
          });
          newAppsFound++;
        }
        appsFound++;
      }

      await db
        .update(scansTable)
        .set({ status: "completed", appsFound, newAppsFound, completedAt: new Date() })
        .where(eq(scansTable.id, scan.id));

      logger.info({ scanId: scan.id, appsFound, newAppsFound }, "Scan completed");
    } catch (err) {
      logger.error({ err, scanId: scan.id }, "Scan failed");
      await db
        .update(scansTable)
        .set({ status: "failed", errorMessage: String(err), completedAt: new Date() })
        .where(eq(scansTable.id, scan.id));
    }
  });
});

export default router;
