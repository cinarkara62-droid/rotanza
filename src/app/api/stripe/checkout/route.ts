import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getStripe, priceIdFor, type BillingCycle, type PlanId } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { plan, cycle, locale } = (await req.json()) as {
    plan?: PlanId;
    cycle?: BillingCycle;
    locale?: string;
  };
  if (plan !== "pro" && plan !== "max") {
    return NextResponse.json({ error: "invalid_plan" }, { status: 400 });
  }
  if (cycle !== "monthly" && cycle !== "yearly") {
    return NextResponse.json({ error: "invalid_cycle" }, { status: 400 });
  }

  const priceId = priceIdFor(plan, cycle);
  if (!priceId) {
    return NextResponse.json(
      { error: "stripe_not_configured", message: "This plan's Stripe price ID is not set yet." },
      { status: 503 }
    );
  }

  let stripe;
  try {
    stripe = getStripe();
  } catch {
    return NextResponse.json(
      { error: "stripe_not_configured", message: "STRIPE_SECRET_KEY is not set yet." },
      { status: 503 }
    );
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "user_not_found" }, { status: 404 });

  let customerId = user.stripeCustomerId ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const loc = locale ?? "tr";

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/${loc}/account?checkout=success`,
    cancel_url: `${appUrl}/${loc}/pricing?checkout=cancelled`,
    metadata: { userId: user.id, plan, cycle },
    subscription_data: { metadata: { userId: user.id, plan, cycle } },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
