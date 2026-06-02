import { defineConfig } from "drizzle-kit";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

// Load repo-root .env for local dev (Node-native, no dependency). No-op on
// Replit/prod where DATABASE_URL is already set.
if (!process.env.DATABASE_URL) {
  const rootEnv = resolve(process.cwd(), "../../.env");
  if (existsSync(rootEnv)) process.loadEnvFile(rootEnv);
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  // Forward-slash relative path: drizzle-kit treats this as a glob, and
  // Windows backslashes (from path.join) break glob matching.
  schema: "./src/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
