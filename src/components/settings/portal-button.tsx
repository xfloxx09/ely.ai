"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function PortalButton() {
  const [loading, setLoading] = useState(false);

  async function openPortal() {
    setLoading(true);
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    setLoading(false);
    if (data.url) window.location.href = data.url;
    else alert(data.error ?? "Unable to open billing portal");
  }

  return (
    <Button variant="outline" onClick={openPortal} disabled={loading}>
      {loading ? "Loading…" : "Manage subscription"}
    </Button>
  );
}
