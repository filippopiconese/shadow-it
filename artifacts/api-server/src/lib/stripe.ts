import Stripe from "stripe";

export function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(key);
}

export const PLAN_PRICE_ID = process.env.STRIPE_PRICE_ID ?? "";
