import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { pool, DATABASE_URL } from "@workspace/db";

const router: IRouter = Router();

// Masked breakdown of the DB connection the app is actually using (no password).
function connectionInfo() {
  try {
    const u = new URL(DATABASE_URL);
    return {
      host: u.hostname,
      port: u.port || "(default)",
      user: decodeURIComponent(u.username),
      database: u.pathname.replace(/^\//, ""),
      passwordLength: u.password.length,
      ssl: process.env.DATABASE_SSL ?? "auto",
    };
  } catch (err) {
    return { parseError: err instanceof Error ? err.message : String(err) };
  }
}

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

// Diagnostic: verifies the database connection and that the schema is applied.
// Public so it can be hit from a browser to debug deploys.
router.get("/healthz/db", async (_req, res): Promise<void> => {
  try {
    await pool.query("select 1");
    const tables = await pool.query<{ count: string }>(
      "select count(*)::text as count from information_schema.tables where table_name = 'organizations'",
    );
    const schemaReady = tables.rows[0]?.count !== "0";
    res.json({ db: "ok", schemaReady, connection: connectionInfo() });
  } catch (err) {
    res.status(500).json({ db: "error", message: err instanceof Error ? err.message : String(err), connection: connectionInfo() });
  }
});

export default router;
