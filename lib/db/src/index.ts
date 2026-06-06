import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";
import { dbSsl } from "./ssl";

const { Pool } = pg;

// Strip accidental surrounding quotes / whitespace that can sneak into the env
// var value (a common cause of "password authentication failed").
export const DATABASE_URL = (process.env.DATABASE_URL ?? "").trim().replace(/^['"]|['"]$/g, "");

if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: DATABASE_URL, ssl: dbSsl() });
export const db = drizzle(pool, { schema });

export { runMigrations } from "./migrate";
export * from "./schema";
