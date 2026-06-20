import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { logger } from "./logger";
import { categorizeApp, scoreApp } from "./risk";

export function getRedirectUri(): string {
  if (process.env.GOOGLE_REDIRECT_URI) return process.env.GOOGLE_REDIRECT_URI;
  const base = process.env.APP_URL?.replace(/\/$/, "");
  if (base) return `${base}/api/auth/google/callback`;
  return "http://localhost:8080/api/auth/google/callback";
}

export function createOAuth2Client(): OAuth2Client {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    getRedirectUri(),
  );
}

export function getAuthUrl(client: OAuth2Client): string {
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent select_account",
    scope: [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/admin.directory.user.readonly",
      "https://www.googleapis.com/auth/admin.directory.user.security",
    ],
  });
}

export async function checkIsWorkspaceAdmin(client: OAuth2Client): Promise<boolean> {
  try {
    const adminClient = google.admin({ version: "directory_v1", auth: client });
    await adminClient.users.list({ customer: "my_customer", maxResults: 1 });
    return true;
  } catch (err: unknown) {
    const status = (err as { code?: number; status?: number }).code ?? (err as { code?: number; status?: number }).status;
    if (status === 403 || status === 401) return false;
    logger.warn({ err }, "Admin check failed with unexpected error");
    return false;
  }
}

export async function refreshTokensIfNeeded(
  client: OAuth2Client,
  tokenExpiry: Date | null,
): Promise<{ accessToken: string | null; refreshToken: string | null; expiry: Date | null } | null> {
  if (!tokenExpiry || tokenExpiry > new Date(Date.now() + 5 * 60 * 1000)) {
    return null;
  }
  try {
    const { credentials } = await client.refreshAccessToken();
    return {
      accessToken: credentials.access_token ?? null,
      refreshToken: credentials.refresh_token ?? null,
      expiry: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
    };
  } catch (err) {
    logger.error({ err }, "Failed to refresh Google tokens");
    return null;
  }
}

export interface DiscoveredApp {
  clientId: string;
  appName: string;
  scopes: string[];
  authorizedUsers: string[];
  iconUrl?: string | null;
}

/** Apps discovered plus every user seen in the directory (emails/UPNs). */
export interface DiscoveryResult {
  apps: DiscoveredApp[];
  directoryUsers: string[];
}

export async function scanWorkspaceApps(
  accessToken: string,
  refreshToken: string,
): Promise<DiscoveryResult> {
  const client = createOAuth2Client();
  client.setCredentials({ access_token: accessToken, refresh_token: refreshToken });

  const adminClient = google.admin({ version: "directory_v1", auth: client });

  const appMap = new Map<string, DiscoveredApp>();
  const directoryUsers: string[] = [];

  // Exclude ShadowGuard's own OAuth client — the admin's grant to us shows up in
  // the token list, and we don't want to flag ourselves as shadow IT.
  const ownClientId = process.env.GOOGLE_CLIENT_ID?.trim();

  let pageToken: string | undefined;

  do {
    const usersRes = await adminClient.users.list({
      customer: "my_customer",
      maxResults: 100,
      pageToken,
      projection: "basic",
    });

    const users = usersRes.data.users ?? [];
    for (const u of users) if (u.primaryEmail) directoryUsers.push(u.primaryEmail);
    logger.info({ count: users.length }, "Scanning users for OAuth tokens");

    await Promise.allSettled(
      users.map(async (user) => {
        if (!user.primaryEmail) return;
        try {
          const tokensRes = await adminClient.tokens.list({ userKey: user.primaryEmail });
          const tokens = tokensRes.data.items ?? [];

          for (const token of tokens) {
            const clientId = token.clientId ?? "unknown";
            if (ownClientId && clientId === ownClientId) continue;
            const appName = token.displayText ?? clientId;
            const scopes = token.scopes ?? [];

            if (appMap.has(clientId)) {
              const existing = appMap.get(clientId)!;
              if (!existing.authorizedUsers.includes(user.primaryEmail)) {
                existing.authorizedUsers.push(user.primaryEmail);
              }
              for (const scope of scopes) {
                if (!existing.scopes.includes(scope)) existing.scopes.push(scope);
              }
            } else {
              appMap.set(clientId, { clientId, appName, scopes, authorizedUsers: [user.primaryEmail] });
            }
          }
        } catch (err) {
          logger.warn({ user: user.primaryEmail, err }, "Failed to list tokens for user");
        }
      }),
    );

    pageToken = usersRes.data.nextPageToken ?? undefined;
  } while (pageToken);

  return { apps: Array.from(appMap.values()), directoryUsers };
}

export function categorizeAndScore(app: DiscoveredApp) {
  return {
    category: categorizeApp(app.appName),
    ...scoreApp(app.scopes, app.authorizedUsers.length),
  };
}
