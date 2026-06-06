import { Router, type IRouter } from "express";
import { runDueScans } from "../lib/scheduler";
import { sendNewHighRiskAppsAlert } from "../lib/email";

const router: IRouter = Router();

// Powerful, NON-production-only endpoints (mounted only when NODE_ENV !==
// "production"). The public demo lives in routes/demo.ts instead.

// Manually trigger the scheduler tick (scans every connected org).
router.post("/dev/run-scheduler", async (_req, res): Promise<void> => {
  const result = await runDueScans();
  res.json(result);
});

// Fire a sample high-risk alert for the logged-in org (verifies the email pipeline).
router.post("/dev/test-alert", async (req, res): Promise<void> => {
  if (!req.session.organizationId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  await sendNewHighRiskAppsAlert(req.session.organizationId, [
    { appName: "Some Random Photo Editor", riskScore: 95, userCount: 1 },
  ]);
  res.json({ success: true });
});

export default router;
