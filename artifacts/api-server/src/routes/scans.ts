import { Router, type IRouter, type Request, type Response } from "express";
import { db, scansTable, organizationsTable, subscriptionsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { createScan, executeScan } from "../lib/scan-service";

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
      removedAppsFound: s.removedAppsFound ?? null,
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

  const scan = await createScan(orgId);

  res.json({
    id: scan.id,
    status: scan.status,
    appsFound: null,
    newAppsFound: null,
    removedAppsFound: null,
    startedAt: scan.startedAt.toISOString(),
    completedAt: null,
    errorMessage: null,
  });

  // Run the scan in the background; client polls GET /scans for status.
  setImmediate(() => executeScan(scan.id, orgId));
});

export default router;
