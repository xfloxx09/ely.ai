"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CheckoutButton({
  plan,
  yearly = false,
  label,
  variant = "primary",
}: {
  plan: "PLUS" | "PRO";
  yearly?: boolean;
  label: string;
  variant?: "primary" | "secondary" | "outline";
}) {
  const [loading, setLoading] = useState(false);

  async function checkout() {
    setLoading(true);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, yearly }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.url) window.location.href = data.url;
    else alert(data.error ?? "Checkout failed. Sign in and configure Stripe prices.");
  }

  return (
    <Button
      variant={variant}
      className="w-full"
      onClick={checkout}
      disabled={loading}
    >
      {loading ? "Redirecting…" : label}
    </Button>
  );
}
