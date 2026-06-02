import { Router, type IRouter, type Request, type Response } from "express";
import { db, subscriptionsTable, usersTable, organizationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getStripeClient, PLAN_PRICE_ID } from "../lib/stripe";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function requireAuth(req: Request, res: Response): boolean {
  if (!req.session.organizationId) {
    res.status(401).json({ error: "Not authenticated" });
    return false;
  }
  return true;
}

function getAppUrl(): string {
  // Public URL of the app, used for Stripe success/cancel/return redirects.
  return (process.env.APP_URL ?? "http://localhost:25255").replace(/\/$/, "");
}

router.get("/billing/status", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;
  const orgId = req.session.organizationId!;

  const [sub] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.organizationId, orgId));

  if (!sub) {
    res.json({ isSubscribed: false, cancelAtPeriodEnd: false });
    return;
  }

  const now = new Date();
  const isSubscribed =
    sub.status === "active" ||
    (sub.status === "trial" && sub.trialEndsAt != null && sub.trialEndsAt > now);

  res.json({
    isSubscribed,
    plan: sub.status === "active" ? "SMB" : sub.status === "trial" ? "Trial" : null,
    currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? sub.trialEndsAt?.toISOString() ?? null,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
  });
});

router.post("/billing/checkout", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;
  const orgId = req.session.organizationId!;

  try {
    const stripe = getStripeClient();

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!));
    const [org] = await db.select().from(organizationsTable).where(eq(organizationsTable.id, orgId));
    const [sub] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.organizationId, orgId));

    let customerId = sub?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user?.email,
        name: org?.name ?? org?.domain,
        metadata: { organizationId: String(orgId) },
      });
      customerId = customer.id;
      if (sub) {
        await db.update(subscriptionsTable).set({ stripeCustomerId: customerId }).where(eq(subscriptionsTable.id, sub.id));
      }
    }

    const appUrl = getAppUrl();
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: PLAN_PRICE_ID, quantity: 1 }],
      success_url: `${appUrl}/billing?success=1`,
      cancel_url: `${appUrl}/billing?canceled=1`,
      metadata: { organizationId: String(orgId) },
    });

    res.json({ url: session.url! });
  } catch (err) {
    logger.error({ err }, "Stripe checkout error");
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

router.post("/billing/portal", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;
  const orgId = req.session.organizationId!;

  try {
    const stripe = getStripeClient();
    const [sub] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.organizationId, orgId));

    if (!sub?.stripeCustomerId) {
      res.status(400).json({ error: "No billing account found" });
      return;
    }

    const appUrl = getAppUrl();
    const portal = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${appUrl}/billing`,
    });

    res.json({ url: portal.url });
  } catch (err) {
    logger.error({ err }, "Stripe portal error");
    res.status(500).json({ error: "Failed to create portal session" });
  }
});

router.post("/billing/webhook", async (req, res): Promise<void> => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret || !sig) {
    res.status(400).json({ error: "Missing webhook secret or signature" });
    return;
  }

  let event;
  try {
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig, webhookSecret);
  } catch (err) {
    logger.error({ err }, "Webhook signature verification failed");
    res.status(400).json({ error: "Invalid signature" });
    return;
  }

  const sub = event.data.object as { metadata?: { organizationId?: string }; customer?: string; status?: string; current_period_end?: number; cancel_at_period_end?: boolean; id?: string; items?: { data?: Array<{ price?: { id?: string } }> } };

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as { metadata?: { organizationId?: string }; customer?: string; subscription?: string };
    const orgId = parseInt(session.metadata?.organizationId ?? "0", 10);
    if (orgId) {
      const stripeObj = await getStripeClient().subscriptions.retrieve(session.subscription as string) as unknown as { current_period_end: number; cancel_at_period_end: boolean; items: { data: Array<{ price: { id: string } }> } };
      await db
        .update(subscriptionsTable)
        .set({
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
          stripePriceId: stripeObj.items.data[0]?.price.id,
          status: "active",
          currentPeriodEnd: new Date(stripeObj.current_period_end * 1000),
          cancelAtPeriodEnd: stripeObj.cancel_at_period_end,
        })
        .where(eq(subscriptionsTable.organizationId, orgId));
    }
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const stripeSubObj = event.data.object as { metadata?: { organizationId?: string }; customer?: string; status?: string; current_period_end?: number; cancel_at_period_end?: boolean; id?: string; items?: { data?: Array<{ price?: { id?: string } }> } };
    const subs = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.stripeSubscriptionId, stripeSubObj.id ?? ""));
    if (subs[0]) {
      await db
        .update(subscriptionsTable)
        .set({
          status: event.type === "customer.subscription.deleted" ? "canceled" : stripeSubObj.status ?? "active",
          currentPeriodEnd: stripeSubObj.current_period_end ? new Date(stripeSubObj.current_period_end * 1000) : null,
          cancelAtPeriodEnd: stripeSubObj.cancel_at_period_end ?? false,
        })
        .where(eq(subscriptionsTable.id, subs[0].id));
    }
  }

  res.json({ received: true });
});

export default router;
