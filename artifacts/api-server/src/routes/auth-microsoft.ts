import { Router, type IRouter } from "express";
import crypto from "node:crypto";
import { db, organizationsTable, usersTable, subscriptionsTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import {
  isMicrosoftConfigured,
  getMicrosoftAuthUrl,
  exchangeMicrosoftCode,
  getMicrosoftAdminConsentUrl,
  verifyTenantAccess,
} from "../lib/microsoft";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// Step 1 — kick off the delegated login that identifies the connecting admin.
router.get("/auth/microsoft", (req, res): void => {
  if (!isMicrosoftConfigured()) {
    res.redirect("/?error=oauth_not_configured");
    return;
  }
  const state = crypto.randomBytes(16).toString("hex");
  req.session.msOauthState = state;
  req.session.save((err) => {
    if (err) {
      logger.error({ err }, "Session save error (microsoft start)");
      res.redirect("/?error=session");
      return;
    }
    res.redirect(getMicrosoftAuthUrl(state));
  });
});

// Step 2 — auth-code callback: identify the admin, upsert org/user, then send
// the admin to the tenant-wide admin-consent screen.
router.get("/auth/microsoft/callback", async (req, res): Promise<void> => {
  const code = req.query["code"];
  const state = req.query["state"];
  if (typeof code !== "string") {
    res.redirect("/?error=missing_code");
    return;
  }
  if (typeof state !== "string" || state !== req.session.msOauthState) {
    res.redirect("/?error=invalid_state");
    return;
  }

  try {
    const admin = await exchangeMicrosoftCode(code);
    const domain = admin.email.split("@")[1] ?? "";
    if (!domain) {
      res.redirect("/?error=invalid_account");
      return;
    }

    let [org] = await db
      .select()
      .from(organizationsTable)
      .where(and(eq(organizationsTable.domain, domain), eq(organizationsTable.provider, "microsoft")));

    // The org is created WITHOUT tenantId: it's only set after admin consent is
    // confirmed (step 3), so an abandoned consent never leaves a half-connected
    // org that the scheduler would keep trying to scan.
    if (!org) {
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 14);

      const inserted = await db
        .insert(organizationsTable)
        .values({ provider: "microsoft", domain, name: domain })
        .returning();
      org = inserted[0]!;

      await db.insert(subscriptionsTable).values({
        organizationId: org.id,
        status: "trial",
        trialEndsAt: trialEnd,
      });
    }

    let [user] = await db
      .select()
      .from(usersTable)
      .where(and(eq(usersTable.provider, "microsoft"), eq(usersTable.externalId, admin.oid)));

    if (!user) {
      const inserted = await db
        .insert(usersTable)
        .values({ organizationId: org.id, provider: "microsoft", externalId: admin.oid, email: admin.email, name: admin.name })
        .returning();
      user = inserted[0]!;
    } else {
      await db.update(usersTable).set({ name: admin.name }).where(eq(usersTable.id, user.id));
    }

    req.session.userId = user.id;
    req.session.organizationId = org.id;
    // Remember the tenant so the consent callback can't be bound to a different one.
    req.session.msTenantId = admin.tenantId;
    // Fresh state for the admin-consent hop.
    const consentState = crypto.randomBytes(16).toString("hex");
    req.session.msOauthState = consentState;

    req.session.save((err) => {
      if (err) {
        logger.error({ err }, "Session save error (microsoft callback)");
        res.redirect("/?error=session");
        return;
      }
      res.redirect(getMicrosoftAdminConsentUrl(admin.tenantId, consentState));
    });
  } catch (err) {
    req.log.error({ err }, "Microsoft OAuth callback error");
    res.redirect("/?error=oauth_failed");
  }
});

const GUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

// Step 3 — admin-consent callback: confirm the tenant granted app permissions.
router.get("/auth/microsoft/consent", async (req, res): Promise<void> => {
  const state = req.query["state"];
  const adminConsent = String(req.query["admin_consent"] ?? "").toLowerCase();
  const tenant = req.query["tenant"];
  const orgId = req.session.organizationId;

  if (!orgId) {
    res.redirect("/?error=session");
    return;
  }
  if (typeof state !== "string" || state !== req.session.msOauthState) {
    res.redirect("/?error=invalid_state");
    return;
  }
  // Tenant must be a GUID and match the one identified at login (no confusion).
  if (typeof tenant !== "string" || !GUID_RE.test(tenant) || tenant !== req.session.msTenantId) {
    res.redirect("/?error=invalid_state");
    return;
  }
  if (adminConsent !== "true") {
    res.redirect("/?error=consent_declined");
    return;
  }

  const ok = await verifyTenantAccess(tenant);
  if (!ok) {
    res.redirect("/?error=consent_failed");
    return;
  }

  // Consent confirmed: now persist the tenant so scans can run.
  await db.update(organizationsTable).set({ tenantId: tenant }).where(eq(organizationsTable.id, orgId));
  // One-time values consumed — clear them.
  delete req.session.msOauthState;
  delete req.session.msTenantId;

  res.redirect("/connect");
});

export default router;
