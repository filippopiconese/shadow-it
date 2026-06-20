import { logger } from "./logger";
import type { DiscoveredApp } from "./google";

// Microsoft 365 (Entra ID) provider. Mirrors lib/google.ts but uses two flows:
//  - Auth-code (delegated) only to identify WHO is connecting (the admin).
//  - App-only client-credentials (our own secret) for the actual scan, so the
//    background scheduler can run without a signed-in user or refresh tokens.
// No SDK dependency: we call the OAuth2 v2 + Graph endpoints with native fetch,
// the same approach used for Resend in lib/email.ts.

const LOGIN_BASE = "https://login.microsoftonline.com";
const GRAPH_BASE = "https://graph.microsoft.com";

// Delegated scopes for the admin login hop (just identity).
const LOGIN_SCOPES = "openid profile email User.Read offline_access";
// App-only token uses the static permissions granted via admin consent.
const APP_SCOPE = `${GRAPH_BASE}/.default`;

// Well-known Microsoft first-party owner tenants — used to filter out built-in
// Microsoft apps so the inventory shows third-party (shadow IT) apps only.
const MICROSOFT_OWNER_TENANTS = new Set([
  "f8cdef31-a31e-4b4a-93e4-5f571e91255a",
  "72f988bf-86f1-41af-91ab-2d7cd011db47",
]);

export function isMicrosoftConfigured(): boolean {
  return Boolean(process.env.MICROSOFT_CLIENT_ID?.trim() && process.env.MICROSOFT_CLIENT_SECRET?.trim());
}

function appBaseUrl(): string {
  return (process.env.APP_URL?.replace(/\/$/, "")) || "http://localhost:8080";
}

/** Redirect URI for the auth-code callback (must be registered in Azure). */
export function getMicrosoftRedirectUri(): string {
  return process.env.MICROSOFT_REDIRECT_URI || `${appBaseUrl()}/api/auth/microsoft/callback`;
}

/** Redirect URI for the admin-consent callback (must be registered in Azure). */
export function getMicrosoftConsentRedirectUri(): string {
  return `${appBaseUrl()}/api/auth/microsoft/consent`;
}

/** Step 1: authorize URL to identify the admin (delegated auth-code flow). */
export function getMicrosoftAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID ?? "",
    response_type: "code",
    redirect_uri: getMicrosoftRedirectUri(),
    response_mode: "query",
    scope: LOGIN_SCOPES,
    state,
    prompt: "select_account",
  });
  return `${LOGIN_BASE}/organizations/oauth2/v2.0/authorize?${params.toString()}`;
}

/** Step 3: admin-consent URL that grants our app tenant-wide permissions. */
export function getMicrosoftAdminConsentUrl(tenantId: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID ?? "",
    redirect_uri: getMicrosoftConsentRedirectUri(),
    scope: APP_SCOPE,
    state,
  });
  return `${LOGIN_BASE}/${tenantId}/v2.0/adminconsent?${params.toString()}`;
}

export interface MicrosoftAdmin {
  oid: string; // stable user object id (subject)
  tenantId: string;
  email: string;
  name: string;
}

interface IdTokenClaims {
  oid?: string;
  tid?: string;
  preferred_username?: string;
  email?: string;
  upn?: string;
  name?: string;
}

function decodeJwtPayload(jwt: string): IdTokenClaims {
  const part = jwt.split(".")[1] ?? "";
  const json = Buffer.from(part.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
  return JSON.parse(json) as IdTokenClaims;
}

/** Step 2: exchange the auth code for tokens and return the admin's identity. */
export async function exchangeMicrosoftCode(code: string): Promise<MicrosoftAdmin> {
  const body = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID ?? "",
    client_secret: process.env.MICROSOFT_CLIENT_SECRET ?? "",
    grant_type: "authorization_code",
    code,
    redirect_uri: getMicrosoftRedirectUri(),
    scope: LOGIN_SCOPES,
  });

  const res = await fetch(`${LOGIN_BASE}/organizations/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Microsoft token exchange failed (${res.status}): ${detail.slice(0, 300)}`);
  }
  const data = (await res.json()) as { id_token?: string };
  if (!data.id_token) throw new Error("Microsoft token response missing id_token");

  const claims = decodeJwtPayload(data.id_token);
  const email = claims.preferred_username || claims.email || claims.upn || "";
  if (!claims.oid || !claims.tid || !email) {
    throw new Error("Microsoft id_token missing required claims (oid/tid/email)");
  }
  return { oid: claims.oid, tenantId: claims.tid, email, name: claims.name || email };
}

// App-only token cache keyed by tenant (tokens last ~60 min).
const appTokenCache = new Map<string, { token: string; expiresAt: number }>();

/** Mints an app-only Graph token for a tenant via client credentials. */
export async function getAppOnlyToken(tenantId: string): Promise<string> {
  const cached = appTokenCache.get(tenantId);
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;

  const body = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID ?? "",
    client_secret: process.env.MICROSOFT_CLIENT_SECRET ?? "",
    grant_type: "client_credentials",
    scope: APP_SCOPE,
  });

  const res = await fetch(`${LOGIN_BASE}/${tenantId}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Microsoft app token failed (${res.status}): ${detail.slice(0, 300)}`);
  }
  const data = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) throw new Error("Microsoft app token response missing access_token");

  appTokenCache.set(tenantId, {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  });
  return data.access_token;
}

/** Confirms admin consent landed by minting an app token + one Graph call. */
export async function verifyTenantAccess(tenantId: string): Promise<boolean> {
  try {
    const token = await getAppOnlyToken(tenantId);
    const res = await fetch(`${GRAPH_BASE}/v1.0/organization?$select=id`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch (err) {
    logger.warn({ err, tenantId }, "Microsoft tenant access verification failed");
    return false;
  }
}

interface GraphList<T> {
  value?: T[];
  "@odata.nextLink"?: string;
}

async function graphGet<T>(token: string, url: string): Promise<T> {
  const full = url.startsWith("http") ? url : `${GRAPH_BASE}${url}`;
  const res = await fetch(full, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Graph ${res.status} on ${url.split("?")[0]}: ${detail.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

/** Follows @odata.nextLink to collect every page of a Graph collection. */
async function graphGetAll<T>(token: string, url: string): Promise<T[]> {
  const out: T[] = [];
  let next: string | undefined = url;
  while (next) {
    const page: GraphList<T> = await graphGet<GraphList<T>>(token, next);
    out.push(...(page.value ?? []));
    next = page["@odata.nextLink"];
  }
  return out;
}

interface OAuth2Grant {
  clientId?: string; // service principal objectId of the client app
  consentType?: string; // "AllPrincipals" | "Principal"
  principalId?: string | null;
  scope?: string;
}

interface ServicePrincipal {
  appId?: string;
  displayName?: string;
  appDisplayName?: string;
  publisherName?: string;
  appOwnerOrganizationId?: string;
  info?: { logoUrl?: string | null } | null;
}

function isMicrosoftFirstParty(sp: ServicePrincipal): boolean {
  if (sp.appOwnerOrganizationId && MICROSOFT_OWNER_TENANTS.has(sp.appOwnerOrganizationId)) return true;
  return (sp.publisherName ?? "").toLowerCase().startsWith("microsoft");
}

/**
 * Discovers third-party OAuth apps consented in a Microsoft 365 tenant via the
 * Graph API, returning the same DiscoveredApp[] shape as the Google scan so the
 * rest of the pipeline (upsert → risk → alerts) is unchanged.
 */
export async function scanWorkspaceApps(tenantId: string): Promise<DiscoveredApp[]> {
  const token = await getAppOnlyToken(tenantId);

  // Delegated permission grants: which app got which scopes for which user.
  const grants = await graphGetAll<OAuth2Grant>(token, "/v1.0/oauth2PermissionGrants?$top=100");

  // Aggregate per client app (service principal objectId).
  const byClient = new Map<string, { scopes: Set<string>; principalIds: Set<string>; allPrincipals: boolean }>();
  for (const g of grants) {
    const cid = g.clientId;
    if (!cid) continue;
    const e = byClient.get(cid) ?? { scopes: new Set<string>(), principalIds: new Set<string>(), allPrincipals: false };
    for (const s of (g.scope ?? "").split(" ").map((t) => t.trim()).filter(Boolean)) e.scopes.add(s);
    if (g.consentType === "AllPrincipals" || !g.principalId) e.allPrincipals = true;
    else e.principalIds.add(g.principalId);
    byClient.set(cid, e);
  }

  logger.info({ tenantId, clientApps: byClient.size }, "Microsoft scan: aggregating OAuth grants");

  const userCache = new Map<string, string>();
  const apps: DiscoveredApp[] = [];

  for (const [spId, e] of byClient) {
    const sp = await graphGet<ServicePrincipal>(
      token,
      `/v1.0/servicePrincipals/${spId}?$select=appId,displayName,appDisplayName,publisherName,appOwnerOrganizationId,info`,
    ).catch((err) => {
      logger.warn({ spId, err }, "Failed to resolve service principal");
      return null;
    });
    if (!sp || isMicrosoftFirstParty(sp)) continue;

    const users: string[] = [];
    if (e.allPrincipals) users.push("(all users)");
    for (const pid of e.principalIds) {
      let upn = userCache.get(pid);
      if (upn === undefined) {
        const u = await graphGet<{ userPrincipalName?: string }>(
          token,
          `/v1.0/users/${pid}?$select=userPrincipalName`,
        ).catch(() => null);
        upn = u?.userPrincipalName ?? pid;
        userCache.set(pid, upn);
      }
      users.push(upn);
    }

    apps.push({
      clientId: sp.appId ?? spId,
      appName: sp.displayName ?? sp.appDisplayName ?? sp.appId ?? "Unknown app",
      scopes: Array.from(e.scopes),
      authorizedUsers: users,
      iconUrl: sp.info?.logoUrl ?? null,
    });
  }

  logger.info({ tenantId, apps: apps.length }, "Microsoft scan complete");
  return apps;
}
