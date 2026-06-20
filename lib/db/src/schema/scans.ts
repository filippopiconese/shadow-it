import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { organizationsTable } from "./organizations";

export const scansTable = pgTable("scans", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizationsTable.id).notNull(),
  status: text("status").notNull().default("pending"),
  appsFound: integer("apps_found"),
  newAppsFound: integer("new_apps_found"),
  removedAppsFound: integer("removed_apps_found"),
  // Total users enumerated in the workspace/tenant during the scan — proves the
  // scan reached the whole directory (so "0 risks" means clean, not partial).
  usersFound: integer("users_found"),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const insertScanSchema = createInsertSchema(scansTable).omit({ id: true });
export type InsertScan = z.infer<typeof insertScanSchema>;
export type Scan = typeof scansTable.$inferSelect;
