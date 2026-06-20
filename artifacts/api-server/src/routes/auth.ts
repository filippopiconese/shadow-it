import { Router, type IRouter } from "express";
import { db, organizationsTable, usersTable, subscriptionsTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { createOAuth2Client, getAuthUrl, checkIsWorkspaceAdmin } from "../lib/google";
import { isEntitled } from "../lib/entitlements";
import { encryptSecret } from "../lib/crypto";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get("/auth/google", (_req, res): void => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    // Redirect back to the landing with a friendly error instead of raw JSON.
    res.redirect("/?error=oauth_not_configured");
    return;
  }
  const client = createOAuth2Client();
  const url = getAuthUrl(client);
  res.redirect(url);
});

router.get("/auth/google/callback", async (req, res): Promise<void> => {
  const code = req.query["code"];
  if (!code || typeof code !== "string") {
    res.redirect("/?error=missing_code");
    return;
  }

  try {
    const client = createOAuth2Client();
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    const isAdmin = await checkIsWorkspaceAdmin(client);
    if (!isAdmin) {
      req.log.warn("OAuth attempt by non-admin user blocked");
      res.redirect("/?error=not_admin");
      return;
    }

    const oauth2 = (await import("googleapis")).google.oauth2({ version: "v2", auth: client });
    const userInfo = await oauth2.userinfo.get();

    const googleId = userInfo.data.id ?? "";
    const email = userInfo.data.email ?? "";
    const name = userInfo.data.name ?? email;
    const picture = userInfo.data.picture ?? null;
    const domain = email.split("@")[1] ?? "";

    if (!domain || !googleId) {
      res.redirect("/?error=invalid_account");
      return;
    }

    let [org] = await db
      .select()
      .from(organizationsTable)
      .where(and(eq(organizationsTable.domain, domain), eq(organizationsTable.provider, "google")));

    if (!org) {
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 14);

      const inserted = await db
        .insert(organizationsTable)
        .values({
          provider: "google",
          domain,
          name: domain,
          accessToken: encryptSecret(tokens.access_token ?? null),
          refreshToken: encryptSecret(tokens.refresh_token ?? null),
          tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        })
        .returning();
      org = inserted[0]!;

      await db.insert(subscriptionsTable).values({
        organizationId: org.id,
        status: "trial",
        trialEndsAt: trialEnd,
      });
    } else {
      await db
        .update(organizationsTable)
        .set({
          accessToken: tokens.access_token ? encryptSecret(tokens.access_token) : org.accessToken,
          refreshToken: tokens.refresh_token ? encryptSecret(tokens.refresh_token) : org.refreshToken,
          tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : org.tokenExpiry,
        })
        .where(eq(organizationsTable.id, org.id));
    }

    let [user] = await db
      .select()
      .from(usersTable)
      .where(and(eq(usersTable.provider, "google"), eq(usersTable.externalId, googleId)));

    if (!user) {
      const inserted = await db
        .insert(usersTable)
        .values({ organizationId: org.id, provider: "google", externalId: googleId, email, name, picture })
        .returning();
      user = inserted[0]!;
    } else {
      await db.update(usersTable).set({ name, picture }).where(eq(usersTable.id, user.id));
    }

    req.session.userId = user.id;
    req.session.organizationId = org.id;

    req.session.save((err) => {
      if (err) {
        logger.error({ err }, "Session save error");
        res.redirect("/?error=session");
        return;
      }
      res.redirect("/connect");
    });
  } catch (err) {
    req.log.error({ err }, "OAuth callback error");
    res.redirect("/?error=oauth_failed");
  }
});

router.get("/auth/me", async (req, res): Promise<void> => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId));
    if (!user) {
      req.session.destroy(() => {});
      res.status(401).json({ error: "User not found" });
      return;
    }

    const [org] = await db
      .select()
      .from(organizationsTable)
      .where(eq(organizationsTable.id, user.organizationId));

    const [sub] = await db
      .select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.organizationId, user.organizationId));

    const isSubscribed = isEntitled(sub);

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture ?? null,
      domain: org?.domain ?? "",
      isSubscribed,
      trialEndsAt: sub?.trialEndsAt?.toISOString() ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching user");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

export default router;
