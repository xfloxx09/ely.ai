"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PROVIDERS = [
  { id: "openai", label: "OpenAI" },
  { id: "anthropic", label: "Anthropic" },
  { id: "google", label: "Google AI" },
] as const;

export function NexusSettingsForm({ isPro }: { isPro: boolean }) {
  const [saved, setSaved] = useState<string[]>([]);
  const [credits, setCredits] = useState(0);
  const [provider, setProvider] = useState<string>("openai");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings/api-keys")
      .then((r) => r.json())
      .then((d) => {
        setSaved(d.providers ?? []);
        setCredits(d.credits ?? 0);
      })
      .catch(() => {});
  }, []);

  async function saveKey() {
    setLoading(true);
    setMessage(null);
    const res = await fetch("/api/settings/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, apiKey }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMessage(data.error ?? "Failed to save");
      return;
    }
    setApiKey("");
    setSaved((s) => [...new Set([...s, provider])]);
    setMessage(`${provider} key saved (encrypted).`);
  }

  async function removeKey(p: string) {
    await fetch(`/api/settings/api-keys?provider=${p}`, { method: "DELETE" });
    setSaved((s) => s.filter((x) => x !== p));
  }

  if (!isPro) {
    return (
      <p className="text-sm text-slate-400">
        Ely Plus: 100 Nexus requests/month on platform keys. Ely Pro: bring your
        own keys (BYOK) or spend Ely Credits per request.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">
        Pro BYOK — keys encrypted at rest. Ely Credits balance:{" "}
        <strong className="text-violet-300">{credits}</strong>
      </p>
      <p className="text-xs text-slate-500">
        In chat: <code className="text-violet-300">/model gpt-4o</code>,{" "}
        <code className="text-violet-300">/model claude</code>,{" "}
        <code className="text-violet-300">/model gemini</code>
      </p>
      <div className="flex flex-wrap gap-2">
        {PROVIDERS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setProvider(p.id)}
            className={
              provider === p.id
                ? "rounded-lg bg-violet-600 px-3 py-1 text-xs text-white"
                : "rounded-lg border border-white/10 px-3 py-1 text-xs text-slate-400"
            }
          >
            {p.label}
            {saved.includes(p.id) ? " ✓" : ""}
          </button>
        ))}
      </div>
      <Input
        type="password"
        placeholder="Paste API key"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
      />
      <div className="flex gap-2">
        <Button onClick={saveKey} disabled={loading || !apiKey}>
          Save key
        </Button>
        {saved.includes(provider) ? (
          <Button variant="outline" onClick={() => removeKey(provider)}>
            Remove
          </Button>
        ) : null}
      </div>
      {message ? <p className="text-sm text-violet-300">{message}</p> : null}
    </div>
  );
}
