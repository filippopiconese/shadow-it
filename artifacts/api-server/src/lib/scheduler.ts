import { db, organizationsTable, subscriptionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { createScan, executeScan } from "./scan-service";
import { isConnected } from "./scan-providers";
import { logger } from "./logger";

let running = false;

/**
 * Scans every connected organization with an active/trial subscription.
 * Exported so it can also be triggered manually (e.g. the dev endpoint).
 */
export async function runDueScans(): Promise<{ scanned: number; skipped: number }> {
  if (running) {
    logger.warn("Scheduled scan tick skipped — previous run still in progress");
    return { scanned: 0, skipped: 0 };
  }
  running = true;
  let scanned = 0;
  let skipped = 0;

  try {
    // Provider-aware: a Google org is connected when it has a token, a Microsoft
    // org when it has a tenant id. Filtered in-app (small org count).
    const allOrgs = await db.select().from(organizationsTable);
    const orgs = allOrgs.filter(isConnected);

    for (const org of orgs) {
      const [sub] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.organizationId, org.id));
      const now = new Date();
      const canScan =
        sub?.status === "active" ||
        (sub?.status === "trial" && sub.trialEndsAt != null && sub.trialEndsAt > now);

      if (!canScan) {
        skipped++;
        continue;
      }

      try {
        const scan = await createScan(org.id);
        await executeScan(scan.id, org.id);
        scanned++;
      } catch (err) {
        logger.error({ err, orgId: org.id }, "Scheduled scan failed for organization");
      }
    }

    logger.info({ scanned, skipped }, "Scheduled scan tick complete");
    return { scanned, skipped };
  } finally {
    running = false;
  }
}

/**
 * Starts the recurring automatic scan. Interval is SCAN_INTERVAL_HOURS (default
 * 24h). Disable with ENABLE_SCHEDULER=false (e.g. in tests).
 */
export function startScheduler(): void {
  if (process.env.ENABLE_SCHEDULER === "false") {
    logger.info("Automatic scan scheduler disabled (ENABLE_SCHEDULER=false)");
    return;
  }

  const hours = Number(process.env.SCAN_INTERVAL_HOURS ?? 24);
  const intervalMs = Math.max(hours, 0.05) * 60 * 60 * 1000;

  const timer = setInterval(() => {
    void runDueScans();
  }, intervalMs);
  // Don't keep the process alive solely for the timer.
  timer.unref?.();

  logger.info({ intervalHours: hours }, "Automatic scan scheduler started");
}
