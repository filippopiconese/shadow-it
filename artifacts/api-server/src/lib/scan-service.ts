import { db, scansTable, oauthAppsTable, organizationsTable, type Organization, type Scan } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { scanWorkspaceApps, categorizeAndScore, createOAuth2Client, refreshTokensIfNeeded } from "./google";
import { sendNewHighRiskAppsAlert } from "./email";
import { logger } from "./logger";

/**
 * Returns a usable access token for the org, refreshing it (and persisting the
 * new credentials) when it is expired or about to expire.
 */
async function getValidAccessToken(org: Organization): Promise<string | null> {
  if (!org.accessToken) return null;

  const client = createOAuth2Client();
  client.setCredentials({
    access_token: org.accessToken,
    refresh_token: org.refreshToken ?? undefined,
  });

  const refreshed = await refreshTokensIfNeeded(client, org.tokenExpiry);
  if (refreshed?.accessToken) {
    await db
      .update(organizationsTable)
      .set({
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken ?? org.refreshToken,
        tokenExpiry: refreshed.expiry,
      })
      .where(eq(organizationsTable.id, org.id));
    logger.info({ orgId: org.id }, "Refreshed Google access token before scan");
    return refreshed.accessToken;
  }

  return org.accessToken;
}

/** Inserts a new scan row in the `running` state. */
export async function createScan(organizationId: number): Promise<Scan> {
  const [scan] = await db
    .insert(scansTable)
    .values({ organizationId, status: "running" })
    .returning();
  if (!scan) throw new Error("Failed to create scan record");
  return scan;
}

/**
 * Runs the actual workspace scan for an existing scan row: refreshes tokens,
 * discovers OAuth apps, upserts them, records counts, and fires a high-risk
 * alert for newly discovered apps. Safe to call from a route (background) or
 * the scheduler (awaited).
 */
export async function executeScan(scanId: number, orgId: number): Promise<void> {
  try {
    const [org] = await db.select().from(organizationsTable).where(eq(organizationsTable.id, orgId));
    if (!org?.accessToken) {
      await db
        .update(scansTable)
        .set({ status: "failed", errorMessage: "Google Workspace not connected", completedAt: new Date() })
        .where(eq(scansTable.id, scanId));
      return;
    }

    const accessToken = await getValidAccessToken(org);
    if (!accessToken) {
      await db
        .update(scansTable)
        .set({ status: "failed", errorMessage: "No valid Google access token", completedAt: new Date() })
        .where(eq(scansTable.id, scanId));
      return;
    }

    const discovered = await scanWorkspaceApps(accessToken, org.refreshToken ?? "");

    let appsFound = 0;
    let newAppsFound = 0;
    const newHighRiskApps: Array<{ appName: string; riskScore: number; userCount: number }> = [];

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
        if (riskLevel === "high") {
          newHighRiskApps.push({ appName: app.appName, riskScore, userCount: app.authorizedUsers.length });
        }
      }
      appsFound++;
    }

    await db
      .update(scansTable)
      .set({ status: "completed", appsFound, newAppsFound, completedAt: new Date() })
      .where(eq(scansTable.id, scanId));

    logger.info({ scanId, appsFound, newAppsFound, newHighRisk: newHighRiskApps.length }, "Scan completed");

    if (newHighRiskApps.length > 0) {
      await sendNewHighRiskAppsAlert(orgId, newHighRiskApps).catch((err) =>
        logger.error({ err, orgId }, "Failed to send high-risk alert"),
      );
    }
  } catch (err) {
    logger.error({ err, scanId }, "Scan failed");
    await db
      .update(scansTable)
      .set({ status: "failed", errorMessage: String(err), completedAt: new Date() })
      .where(eq(scansTable.id, scanId));
  }
}
