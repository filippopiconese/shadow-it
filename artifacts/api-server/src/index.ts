import "./env";
import { pool, runMigrations } from "@workspace/db";
import app from "./app";
import { logger } from "./lib/logger";
import { startScheduler } from "./lib/scheduler";

// Default to 8080 locally (matches the Vite dev proxy target).
const rawPort = process.env["PORT"] ?? "8080";

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function main(): Promise<void> {
  // Apply the schema using the app's own pg connection (idempotent). Done here
  // instead of drizzle-kit, which can't introspect over Railway's private network.
  try {
    await runMigrations(pool);
    logger.info("Database schema ready");
  } catch (err) {
    logger.error({ err }, "Database migration failed — starting anyway (see /api/healthz/db)");
  }

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }
    logger.info({ port }, "Server listening");
    startScheduler();
  });
}

void main();
