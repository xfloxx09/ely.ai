import Link from "next/link";
import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckoutButton } from "@/components/pricing/checkout-button";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export const metadata = { title: "Pricing" };

const plans = [
  {
    name: "Ely Free",
    price: "$0",
    period: "forever",
    features: [
      "20 messages per day",
      "Default ELY persona (no adaptation)",
      "Personality test stored for when you upgrade",
      "Concierge & Scribe modules",
      "No Model Nexus",
    ],
    cta: (
      <Link href="/register">
        <Button variant="outline" className="w-full">
          Get started
        </Button>
      </Link>
    ),
  },
  {
    name: "Ely Plus",
    price: "$19",
    period: "/month",
    highlight: true,
    features: [
      "Unlimited ELY chat",
      "Full task suite (modules rolling out)",
      "BFI-2 personality adaptation (tone)",
      "100 Model Nexus requests / month",
      "Retail customer — not affiliate eligible",
    ],
    cta: <CheckoutButton plan="PLUS" label="Subscribe to Plus" />,
    ctaYearly: (
      <CheckoutButton
        plan="PLUS"
        yearly
        label="Plus yearly — $199"
        variant="outline"
      />
    ),
  },
  {
    name: "Ely Pro",
    price: "$49",
    period: "/month",
    features: [
      "Everything in Plus",
      "Full personality persona + deep memory",
      "Custom avatar (Ready Player Me — Phase 2)",
      "Unlimited Nexus with your API keys",
      "Priority models & affiliate program",
      "Avatar Boutique purchases count toward GV",
    ],
    cta: <CheckoutButton plan="PRO" label="Subscribe to Pro" />,
  },
];

export default async function PricingPage() {
  const session = await auth();

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white">Invest in a companion, not a chatbot</h1>
        <p className="mt-4 text-slate-400">
          Personality depth is the core differentiator. Upgrade when you&apos;re ready.
        </p>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={
              plan.highlight
                ? "border-violet-500/50 ring-1 ring-violet-500/30"
                : ""
            }
          >
            <CardHeader>
              {plan.highlight ? (
                <span className="text-xs font-medium uppercase tracking-wide text-violet-400">
                  Most popular
                </span>
              ) : null}
              <CardTitle>{plan.name}</CardTitle>
              <p className="mt-2">
                <span className="text-3xl font-bold text-white">{plan.price}</span>
                <span className="text-slate-400">{plan.period}</span>
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-slate-300">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
                    {f}
                  </li>
                ))}
              </ul>
              {session?.user ? (
                <div className="space-y-2">
                  {plan.cta}
                  {"ctaYearly" in plan ? plan.ctaYearly : null}
                </div>
              ) : (
                <Link href="/register">
                  <Button className="w-full" variant={plan.highlight ? "primary" : "outline"}>
                    Sign up to subscribe
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="mt-10 text-center text-sm text-slate-500">
        Avatar Boutique cosmetics and Ely Credits packs — coming soon. 30-day
        money-back on first subscription.{" "}
        <Link href="/legal/terms" className="text-violet-400 hover:underline">
          Terms
        </Link>
      </p>
    </div>
  );
}
