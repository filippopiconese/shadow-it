import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import appsRouter from "./apps";
import scansRouter from "./scans";
import dashboardRouter from "./dashboard";
import billingRouter from "./billing";
import demoRouter from "./demo";
import devRouter from "./dev";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(appsRouter);
router.use(scansRouter);
router.use(dashboardRouter);
router.use(billingRouter);

// Public, sandboxed demo (try-before-connect). On by default — even in
// production — so prospects can evaluate the product. Disable with DEMO_ENABLED=false.
if (process.env.DEMO_ENABLED !== "false") {
  router.use(demoRouter);
}

// Powerful dev-only endpoints (scheduler trigger, test alert) — never in production.
if (process.env.NODE_ENV !== "production") {
  router.use(devRouter);
}

export default router;
