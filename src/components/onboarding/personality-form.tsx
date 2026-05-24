"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BFI2_SHORT_ITEMS, LIKERT_LABELS } from "@/lib/personality/bfi2-short";
import { PERSONALITY_CONSENT } from "@/lib/personality/consent";
import { Button } from "@/components/ui/button";

export function PersonalityForm() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const chunkSize = 6;
  const chunks = Math.ceil(BFI2_SHORT_ITEMS.length / chunkSize);
  const items = BFI2_SHORT_ITEMS.slice(
    step * chunkSize,
    step * chunkSize + chunkSize
  );

  async function submit() {
    setError(null);
    setLoading(true);
    const res = await fetch("/api/personality/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answers: Object.fromEntries(
          Object.entries(answers).map(([k, v]) => [k, v])
        ),
        consent: true,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Submission failed");
      return;
    }
    router.push("/onboarding/complete");
    router.refresh();
  }

  const allAnswered = BFI2_SHORT_ITEMS.every((i) => answers[i.id] != null);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-violet-400">Step {step + 1} of {chunks}</p>
        <h1 className="text-2xl font-bold text-white">Personality snapshot</h1>
        <p className="mt-2 text-slate-400">
          ~5 minutes · 30 questions · powers how ELY speaks with you
        </p>
      </div>

      <div className="space-y-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-white/10 bg-white/5 p-4"
          >
            <p className="text-sm text-white">{item.text}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() =>
                    setAnswers((a) => ({ ...a, [item.id]: v }))
                  }
                  className={
                    answers[item.id] === v
                      ? "rounded-lg bg-violet-600 px-3 py-1.5 text-xs text-white"
                      : "rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-400 hover:bg-white/5"
                  }
                  title={LIKERT_LABELS[v - 1]}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {step < chunks - 1 ? (
        <Button
          className="w-full"
          disabled={items.some((i) => !answers[i.id])}
          onClick={() => setStep((s) => s + 1)}
        >
          Continue
        </Button>
      ) : (
        <div className="space-y-4">
          <label className="flex gap-3 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1"
            />
            <span>
              <strong className="text-white">{PERSONALITY_CONSENT.title}</strong>
              <br />
              {PERSONALITY_CONSENT.body}
            </span>
          </label>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <Button
            className="w-full"
            disabled={!allAnswered || !consent || loading}
            onClick={submit}
          >
            {loading ? "Calibrating ELY…" : "Meet your ELY"}
          </Button>
        </div>
      )}

      {step > 0 ? (
        <button
          type="button"
          className="text-sm text-slate-500 hover:text-slate-300"
          onClick={() => setStep((s) => s - 1)}
        >
          Back
        </button>
      ) : null}
    </div>
  );
}
