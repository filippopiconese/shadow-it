import { pgTable, text, serial, integer, boolean, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const organizationsTable = pgTable(
  "organizations",
  {
    id: serial("id").primaryKey(),
    // Identity provider this org connected through. The same company domain can
    // exist on both Google and Microsoft, hence the (domain, provider) unique below.
    provider: text("provider").notNull().default("google"), // "google" | "microsoft"
    domain: text("domain").notNull(),
    name: text("name"),
    // Google delegated OAuth: per-org access/refresh tokens we refresh ourselves.
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    tokenExpiry: timestamp("token_expiry", { withTimezone: true }),
    // Microsoft app-only: we store just the tenant id and mint app tokens via
    // client credentials (our own secret) at scan time — no per-org tokens.
    tenantId: text("tenant_id"),
    // Per-customer SMTP for alert emails (so mail never routes through our infra).
    smtpHost: text("smtp_host"),
    smtpPort: integer("smtp_port"),
    smtpSecure: boolean("smtp_secure").notNull().default(false),
    smtpUser: text("smtp_user"),
    smtpPass: text("smtp_pass"), // encrypted at rest
    emailFrom: text("email_from"),
    alertEmails: text("alert_emails"), // comma-separated; falls back to org users
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [uniqueIndex("org_domain_provider_uq").on(t.domain, t.provider)],
);

export const insertOrganizationSchema = createInsertSchema(organizationsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Organization = typeof organizationsTable.$inferSelect;
