import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import appsRouter from "./apps";
import scansRouter from "./scans";
import dashboardRouter from "./dashboard";
import billingRouter from "./billing";
import devRouter from "./dev";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(appsRouter);
router.use(scansRouter);
router.use(dashboardRouter);
router.use(billingRouter);

// Demo seed + login bypass — dev/staging only, never in production.
if (process.env.NODE_ENV !== "production") {
  router.use(devRouter);
}

export default router;
