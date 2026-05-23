import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { Plan, SubscriptionStatus, UserRole } from "@prisma/client";
import { db } from "@/lib/db";
import { getStripe, planFromPriceId } from "@/lib/stripe";
import { recordFastStartCommission } from "@/lib/mlm/commissions";

export const runtime = "nodejs";

function subscriptionPeriodEnd(stripeSubscription: Stripe.Subscription): Date {
  const itemEnd = stripeSubscription.items.data[0]?.current_period_end;
  const anchor = stripeSubscription.billing_cycle_anchor;
  const unix = itemEnd ?? anchor ?? Math.floor(Date.now() / 1000);
  return new Date(unix * 1000);
}

async function syncSubscription(
  stripeSubscription: Stripe.Subscription,
  userId: string
) {
  const priceId = stripeSubscription.items.data[0]?.price.id ?? "";
  const plan =
    planFromPriceId(priceId) ??
    ((stripeSubscription.metadata.plan as Plan) || "FREE");

  const statusMap: Record<string, SubscriptionStatus> = {
    active: "ACTIVE",
    canceled: "CANCELED",
    past_due: "PAST_DUE",
    trialing: "TRIALING",
    incomplete: "INCOMPLETE",
  };

  const status =
    statusMap[stripeSubscription.status] ?? SubscriptionStatus.INCOMPLETE;

  const currentPeriodEnd = subscriptionPeriodEnd(stripeSubscription);

  await db.subscription.upsert({
    where: { userId },
    create: {
      userId,
      plan,
      status,
      stripeSubscriptionId: stripeSubscription.id,
      stripePriceId: priceId,
      currentPeriodEnd,
    },
    update: {
      plan,
      status,
      stripeSubscriptionId: stripeSubscription.id,
      stripePriceId: priceId,
      currentPeriodEnd,
    },
  });

  if (plan === "PRO" && status === "ACTIVE") {
    await db.user.update({
      where: { id: userId },
      data: { role: UserRole.AFFILIATE, rank: "EXPLORER" },
    });
  } else if (status !== "ACTIVE" || plan === "FREE") {
    await db.user.update({
      where: { id: userId },
      data: { role: UserRole.RETAIL },
    });
  }
}

export async function POST(req: Request) {
  const body = await req.text();
  const headerStore = await headers();
  const sig = headerStore.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature error:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        if (userId && session.subscription) {
          const sub = await getStripe().subscriptions.retrieve(
            String(session.subscription)
          );
          await syncSubscription(sub, userId);
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        if (userId) {
          if (event.type === "customer.subscription.deleted") {
            await db.subscription.update({
              where: { userId },
              data: { plan: "FREE", status: "CANCELED", stripeSubscriptionId: null },
            });
            await db.user.update({
              where: { id: userId },
              data: { role: UserRole.RETAIL },
            });
          } else {
            await syncSubscription(sub, userId);
          }
        }
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const subRef =
          invoice.parent?.subscription_details?.subscription ?? null;
        if (!subRef) break;

        const sub = await getStripe().subscriptions.retrieve(String(subRef));
        const userId = sub.metadata?.userId;
        if (!userId) break;

        await syncSubscription(sub, userId);

        const plan = planFromPriceId(sub.items.data[0]?.price.id ?? "");
        if (plan && plan !== "FREE") {
          await recordFastStartCommission(userId, plan);
        }
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error("Webhook handler error:", e);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
