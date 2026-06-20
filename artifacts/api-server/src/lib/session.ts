import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "@workspace/db";

declare module "express-session" {
  interface SessionData {
    userId: number;
    organizationId: number;
    isDemo?: boolean;
    // CSRF state for the Microsoft OAuth / admin-consent round trip.
    msOauthState?: string;
    // Tenant identified at login, to verify the admin-consent callback matches.
    msTenantId?: string;
  }
}

const PgSession = connectPgSimple(session);

export function createSessionMiddleware() {
  return session({
    store: new PgSession({
      pool,
      tableName: "user_sessions",
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET ?? "dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  });
}
