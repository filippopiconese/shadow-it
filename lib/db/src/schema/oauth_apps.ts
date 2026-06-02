import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { organizationsTable } from "./organizations";

export const oauthAppsTable = pgTable("oauth_apps", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizationsTable.id).notNull(),
  clientId: text("client_id").notNull(),
  appName: text("app_name").notNull(),
  category: text("category").notNull().default("Other"),
  riskLevel: text("risk_level").notNull().default("low"),
  riskScore: integer("risk_score").notNull().default(0),
  scopes: text("scopes").array().notNull().default([]),
  authorizedUsers: text("authorized_users").array().notNull().default([]),
  isDismissed: boolean("is_dismissed").notNull().default(false),
  iconUrl: text("icon_url"),
  firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).notNull().defaultNow(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertOauthAppSchema = createInsertSchema(oauthAppsTable).omit({ id: true });
export type InsertOauthApp = z.infer<typeof insertOauthAppSchema>;
export type OauthApp = typeof oauthAppsTable.$inferSelect;
