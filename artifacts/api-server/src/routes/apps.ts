import { Router, type IRouter, type Request, type Response } from "express";
import { db, oauthAppsTable } from "@workspace/db";
import { eq, and, ilike, sql } from "drizzle-orm";
import {
  ListAppsQueryParams,
  GetAppParams,
  DismissAppParams,
} from "@workspace/api-zod";
import { getScopeDescriptions, scoreApp } from "../lib/risk";

const router: IRouter = Router();

function requireAuth(req: Request, res: Response): boolean {
  if (!req.session.organizationId) {
    res.status(401).json({ error: "Not authenticated" });
    return false;
  }
  return true;
}

router.get("/apps", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;
  const orgId = req.session.organizationId!;

  const query = ListAppsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { risk, category, search } = query.data;

  let conditions = [eq(oauthAppsTable.organizationId, orgId)];

  if (risk && risk !== "all") {
    conditions.push(eq(oauthAppsTable.riskLevel, risk));
  }
  if (category) {
    conditions.push(eq(oauthAppsTable.category, category));
  }
  if (search) {
    conditions.push(ilike(oauthAppsTable.appName, `%${search}%`));
  }

  const apps = await db
    .select()
    .from(oauthAppsTable)
    .where(and(...conditions))
    .orderBy(sql`${oauthAppsTable.riskScore} DESC, ${oauthAppsTable.lastSeenAt} DESC`);

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
      status: a.status,
    })),
  );
});

router.get("/apps/:appId", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;
  const orgId = req.session.organizationId!;

  const raw = Array.isArray(req.params["appId"]) ? req.params["appId"][0] : req.params["appId"];
  const params = GetAppParams.safeParse({ appId: parseInt(raw ?? "0", 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [app] = await db
    .select()
    .from(oauthAppsTable)
    .where(and(eq(oauthAppsTable.id, params.data.appId), eq(oauthAppsTable.organizationId, orgId)));

  if (!app) {
    res.status(404).json({ error: "App not found" });
    return;
  }

  const scopes = app.scopes ?? [];
  const { riskReasons } = scoreApp(scopes, (app.authorizedUsers ?? []).length);

  res.json({
    id: app.id,
    clientId: app.clientId,
    appName: app.appName,
    category: app.category,
    riskLevel: app.riskLevel,
    riskScore: app.riskScore,
    userCount: (app.authorizedUsers ?? []).length,
    scopes,
    isDismissed: app.isDismissed,
    firstSeenAt: app.firstSeenAt.toISOString(),
    lastSeenAt: app.lastSeenAt.toISOString(),
    iconUrl: app.iconUrl ?? null,
    status: app.status,
    authorizedUsers: app.authorizedUsers ?? [],
    scopeDescriptions: getScopeDescriptions(scopes),
    riskReasons,
  });
});

router.post("/apps/:appId/dismiss", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;
  const orgId = req.session.organizationId!;

  const raw = Array.isArray(req.params["appId"]) ? req.params["appId"][0] : req.params["appId"];
  const params = DismissAppParams.safeParse({ appId: parseInt(raw ?? "0", 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [app] = await db
    .update(oauthAppsTable)
    .set({ isDismissed: true })
    .where(and(eq(oauthAppsTable.id, params.data.appId), eq(oauthAppsTable.organizationId, orgId)))
    .returning();

  if (!app) {
    res.status(404).json({ error: "App not found" });
    return;
  }

  res.json({
    id: app.id,
    clientId: app.clientId,
    appName: app.appName,
    category: app.category,
    riskLevel: app.riskLevel,
    riskScore: app.riskScore,
    userCount: (app.authorizedUsers ?? []).length,
    scopes: app.scopes ?? [],
    isDismissed: app.isDismissed,
    firstSeenAt: app.firstSeenAt.toISOString(),
    lastSeenAt: app.lastSeenAt.toISOString(),
    iconUrl: app.iconUrl ?? null,
    status: app.status,
  });
});

export default router;
