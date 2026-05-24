"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function PersonaSettingsForm({
  initialOptOut,
}: {
  initialOptOut: boolean;
}) {
  const [optOut, setOptOut] = useState(initialOptOut);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setSaved(false);
    await fetch("/api/user/persona-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optOutPersonalization: optOut }),
    });
    setLoading(false);
    setSaved(true);
  }

  return (
    <div className="space-y-4">
      <label className="flex items-start gap-3 text-sm text-slate-300">
        <input
          type="checkbox"
          checked={optOut}
          onChange={(e) => setOptOut(e.target.checked)}
          className="mt-1"
        />
        <span>
          Use neutral default persona (opt out of personality-based adaptation)
        </span>
      </label>
      <div className="flex gap-2">
        <Button size="sm" onClick={save} disabled={loading}>
          {loading ? "Saving…" : "Save"}
        </Button>
        <a
          href="/api/user/export"
          className="text-sm text-violet-400 hover:underline self-center"
          target="_blank"
          rel="noreferrer"
        >
          Export my data
        </a>
      </div>
      {saved ? (
        <p className="text-sm text-emerald-400">Saved.</p>
      ) : null}
      <p className="text-xs text-slate-500">
        Retake personality test from onboarding (coming soon in settings).
      </p>
    </div>
  );
}
