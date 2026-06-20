import { db, organizationsTable, type Organization } from "@workspace/db";
import { eq } from "drizzle-orm";
import { scanWorkspaceApps as scanGoogleApps, createOAuth2Client, refreshTokensIfNeeded, type DiscoveredApp, type DiscoveryResult } from "./google";
import { scanWorkspaceApps as scanMicrosoftApps } from "./microsoft";
import { DEMO_APPS, DEMO_NEW_APP, DEMO_DOMAIN } from "./demo-data";
import { encryptSecret, decryptSecret } from "./crypto";
import { logger } from "./logger";

/**
 * When SCAN_PROVIDER=mock the scan returns synthetic apps instead of calling
 * a real provider — lets the full scan pipeline (trigger → upsert → alerts →
 * polling) be exercised end-to-end without a real workspace.
 */
export function isMockProvider(): boolean {
  return (process.env.SCAN_PROVIDER ?? "google").toLowerCase() === "mock";
}

// One seeded app the mock scan intentionally does NOT return, so the first scan
// after a demo login reports it as revoked (exercises the removed-apps diff).
const MOCK_REVOKED_CLIENT_ID = "100008.apps.googleusercontent.com"; // Loom

function mockDiscover(): DiscoveredApp[] {
  const apps: DiscoveredApp[] = DEMO_APPS.filter((a) => a.clientId !== MOCK_REVOKED_CLIENT_ID).map((a) => ({
    clientId: a.clientId,
    appName: a.appName,
    scopes: a.scopes,
    authorizedUsers: a.users,
    iconUrl: a.iconUrl,
  }));
  // Surface one app that the demo seed doesn't include, so the first scan
  // after a demo login reports a brand-new high-risk discovery.
  apps.push({
    clientId: DEMO_NEW_APP.clientId,
    appName: DEMO_NEW_APP.appName,
    scopes: DEMO_NEW_APP.scopes,
    authorizedUsers: DEMO_NEW_APP.users,
    iconUrl: DEMO_NEW_APP.iconUrl,
  });
  return apps;
}

/** Distinct users across the mock apps — a plausible "directory" for the demo. */
function mockDirectoryUsers(apps: DiscoveredApp[]): string[] {
  const set = new Set<string>();
  for (const a of apps) for (const u of a.authorizedUsers) set.add(u);
  return Array.from(set);
}

/**
 * Returns a usable Google access token for the org, refreshing it (and
 * persisting the new credentials) when it is expired or about to expire.
 */
async function getValidGoogleToken(org: Organization): Promise<string | null> {
  if (!org.accessToken) return null;

  const client = createOAuth2Client();
  client.setCredentials({
    access_token: decryptSecret(org.accessToken) ?? undefined,
    refresh_token: decryptSecret(org.refreshToken) ?? undefined,
  });

  const refreshed = await refreshTokensIfNeeded(client, org.tokenExpiry);
  if (refreshed?.accessToken) {
    await db
      .update(organizationsTable)
      .set({
        accessToken: encryptSecret(refreshed.accessToken),
        refreshToken: refreshed.refreshToken ? encryptSecret(refreshed.refreshToken) : org.refreshToken,
        tokenExpiry: refreshed.expiry,
      })
      .where(eq(organizationsTable.id, org.id));
    logger.info({ orgId: org.id }, "Refreshed Google access token before scan");
    return refreshed.accessToken;
  }

  return decryptSecret(org.accessToken);
}

/** True when the org has the credentials its provider needs to be scanned. */
export function isConnected(org: Organization): boolean {
  if (org.provider === "microsoft") return Boolean(org.tenantId);
  return Boolean(org.accessToken);
}

/**
 * Discovers the OAuth apps for an org via the active provider, returning a
 * provider-agnostic DiscoveredApp[]. Handles token acquisition internally so
 * callers (route + scheduler) don't need to know about Google vs Microsoft.
 */
export async function discoverWorkspaceApps(org: Organization): Promise<DiscoveryResult> {
  // The demo org is always mock — even in production with SCAN_PROVIDER=google —
  // so the public demo never makes a real provider call.
  if (isMockProvider() || org.domain === DEMO_DOMAIN) {
    const apps = mockDiscover();
    return { apps, directoryUsers: mockDirectoryUsers(apps) };
  }

  if (org.provider === "microsoft") {
    if (!org.tenantId) throw new Error("Microsoft 365 not connected (missing tenant)");
    return scanMicrosoftApps(org.tenantId);
  }

  const token = await getValidGoogleToken(org);
  if (!token) throw new Error("No valid Google access token");
  return scanGoogleApps(token, decryptSecret(org.refreshToken) ?? "");
}
