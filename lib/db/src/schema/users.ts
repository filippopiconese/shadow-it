import { pgTable, text, serial, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { organizationsTable } from "./organizations";

export const usersTable = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id").references(() => organizationsTable.id).notNull(),
    provider: text("provider").notNull().default("google"), // "google" | "microsoft"
    // Provider subject id: Google userinfo `id`, or Microsoft `oid`.
    externalId: text("external_id").notNull(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    picture: text("picture"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [uniqueIndex("users_provider_external_id_uq").on(t.provider, t.externalId)],
);

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
