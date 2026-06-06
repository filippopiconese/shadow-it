import { type Organization } from "@workspace/db";
import { scanWorkspaceApps, type DiscoveredApp } from "./google";
import { DEMO_APPS, DEMO_NEW_APP, DEMO_DOMAIN } from "./demo-data";

/**
 * When SCAN_PROVIDER=mock the scan returns synthetic apps instead of calling
 * the Google Admin SDK — lets the full scan pipeline (trigger → upsert →
 * alerts → polling) be exercised end-to-end without a real Google Workspace.
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

/** Discovers the OAuth apps for an org via the active provider. */
export async function discoverWorkspaceApps(
  org: Organization,
  accessToken?: string,
): Promise<DiscoveredApp[]> {
  // The demo org is always mock — even in production with SCAN_PROVIDER=google —
  // so the public demo never makes a real Google call.
  if (isMockProvider() || org.domain === DEMO_DOMAIN) return mockDiscover();
  return scanWorkspaceApps(accessToken ?? org.accessToken ?? "", org.refreshToken ?? "");
}
