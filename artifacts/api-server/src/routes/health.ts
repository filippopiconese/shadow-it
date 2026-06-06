import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { pool } from "@workspace/db";

const router: IRouter = Router();

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
    res.json({ db: "ok", schemaReady });
  } catch (err) {
    res.status(500).json({ db: "error", message: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
