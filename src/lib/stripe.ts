import Stripe from "stripe";

let stripeSingleton: Stripe | null = null;

// Lazily constructed so the app still builds/runs without a Stripe key —
// only routes that actually call this will fail until STRIPE_SECRET_KEY is set.
export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Add it to .env after creating a free Stripe account."
    );
  }
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeSingleton;
}

export type PlanId = "pro" | "max";
export type BillingCycle = "monthly" | "yearly";

export function priceIdFor(plan: PlanId, cycle: BillingCycle): string | undefined {
  const key = `STRIPE_PRICE_${plan.toUpperCase()}_${cycle.toUpperCase()}`;
  return process.env[key];
}
