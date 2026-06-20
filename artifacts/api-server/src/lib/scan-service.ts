import { db, scansTable, oauthAppsTable, organizationsTable, type Scan } from "@workspace/db";
import { eq, and, notInArray } from "drizzle-orm";
import { categorizeAndScore } from "./google";
import { discoverWorkspaceApps, isMockProvider, isConnected } from "./scan-providers";
import { DEMO_DOMAIN } from "./demo-data";
import { sendNewHighRiskAppsAlert } from "./email";
import { logger } from "./logger";

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
    if (!org) {
      await db
        .update(scansTable)
        .set({ status: "failed", errorMessage: "Organization not found", completedAt: new Date() })
        .where(eq(scansTable.id, scanId));
      return;
    }

    // A real scan needs the org's provider credentials; the mock provider and
    // the demo org (always mock) don't.
    if (!isMockProvider() && org.domain !== DEMO_DOMAIN && !isConnected(org)) {
      const what = org.provider === "microsoft" ? "Microsoft 365" : "Google Workspace";
      await db
        .update(scansTable)
        .set({ status: "failed", errorMessage: `${what} not connected`, completedAt: new Date() })
        .where(eq(scansTable.id, scanId));
      return;
    }

    const { apps: discoveredApps, directoryUsers } = await discoverWorkspaceApps(org);

    let appsFound = 0;
    let newAppsFound = 0;
    const newHighRiskApps: Array<{ appName: string; riskScore: number; userCount: number }> = [];
    const discoveredClientIds = discoveredApps.map((d) => d.clientId);

    for (const app of discoveredApps) {
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
            iconUrl: app.iconUrl ?? existing.iconUrl,
            status: "active", // reactivate if it had been marked removed
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
          iconUrl: app.iconUrl ?? null,
        });
        newAppsFound++;
        if (riskLevel === "high") {
          newHighRiskApps.push({ appName: app.appName, riskScore, userCount: app.authorizedUsers.length });
        }
      }
      appsFound++;
    }

    // Diff: apps previously active but absent from this scan have been revoked.
    let removedAppsFound = 0;
    if (discoveredClientIds.length > 0) {
      const removed = await db
        .update(oauthAppsTable)
        .set({ status: "removed" })
        .where(
          and(
            eq(oauthAppsTable.organizationId, orgId),
            eq(oauthAppsTable.status, "active"),
            notInArray(oauthAppsTable.clientId, discoveredClientIds),
          ),
        )
        .returning();
      removedAppsFound = removed.length;
    }

    await db
      .update(scansTable)
      .set({ status: "completed", appsFound, newAppsFound, removedAppsFound, usersFound: directoryUsers.length, completedAt: new Date() })
      .where(eq(scansTable.id, scanId));

    // Persist the directory roster on the org so admins can review it on demand.
    await db
      .update(organizationsTable)
      .set({ directoryUsers })
      .where(eq(organizationsTable.id, orgId));

    logger.info(
      { scanId, appsFound, newAppsFound, removedAppsFound, usersFound: directoryUsers.length, newHighRisk: newHighRiskApps.length },
      "Scan completed",
    );

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
