import Stripe from "stripe";
import { Plan } from "@prisma/client";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
    _stripe = new Stripe(key, { typescript: true });
  }
  return _stripe;
}

export const PRICE_IDS = {
  plusMonthly: process.env.STRIPE_PRICE_PLUS_MONTHLY ?? "",
  plusYearly: process.env.STRIPE_PRICE_PLUS_YEARLY ?? "",
  proMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY ?? "",
} as const;

export function planFromPriceId(priceId: string): Plan | null {
  if (priceId === PRICE_IDS.proMonthly) return "PRO";
  if (priceId === PRICE_IDS.plusMonthly || priceId === PRICE_IDS.plusYearly)
    return "PLUS";
  return null;
}

export function priceIdForPlan(plan: "PLUS" | "PRO", yearly = false): string {
  if (plan === "PRO") return PRICE_IDS.proMonthly;
  return yearly ? PRICE_IDS.plusYearly : PRICE_IDS.plusMonthly;
}
