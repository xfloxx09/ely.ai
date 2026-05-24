"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { BFI2_SHORT_ITEMS } from "@/lib/personality/bfi2-short";
import { PERSONALITY_CONSENT } from "@/lib/personality/consent";
import {
  BRIDGE_CHAPTERS,
  buildJourneySlides,
  choiceStory,
  questionStory,
  sceneForItem,
  type JourneySlide,
} from "@/lib/personality/narrative";
import { generateCompanionName } from "@/lib/personality/companion-names";
import type { BigFiveScores } from "@/lib/personality/scoring";
import { ElyFaceReveal } from "@/components/onboarding/ely-face-reveal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PersonalityJourney() {
  const router = useRouter();
  const { update } = useSession();
  const slides = useMemo(() => buildJourneySlides(), []);
  const [slideIndex, setSlideIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [animating, setAnimating] = useState(false);
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [scores, setScores] = useState<BigFiveScores | null>(null);
  const [suggestedName, setSuggestedName] = useState("");
  const [companionName, setCompanionName] = useState("");

  const slide = slides[slideIndex];
  const answeredCount = Object.keys(answers).length;
  const progress = answeredCount / BFI2_SHORT_ITEMS.length;

  function goNext(delay = 0) {
    setAnimating(true);
    window.setTimeout(() => {
      setSlideIndex((i) => Math.min(i + 1, slides.length - 1));
      setAnimating(false);
    }, delay);
  }

  function pickAnswer(itemId: number, value: number) {
    setAnswers((prev) => ({ ...prev, [itemId]: value }));
    goNext(420);
  }

  async function submitAndReveal() {
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
        companionName: companionName.trim() || suggestedName,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not save your profile");
      return;
    }
    const computed = data.scores as BigFiveScores;
    setScores(computed);
    const suggested =
      data.suggestedName ?? generateCompanionName(computed);
    setSuggestedName(suggested);
    setCompanionName(data.companionName ?? suggested);
    setRevealed(true);
    await update({ onboardingStep: "COMPLETE" });
  }

  async function finishNaming() {
    const name = companionName.trim() || suggestedName;
    if (!scores) {
      router.push("/onboarding/complete");
      return;
    }
    setLoading(true);
    await fetch("/api/personality/name", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companionName: name }),
    });
    setLoading(false);
    router.push("/onboarding/complete");
    router.refresh();
  }

  const showFinale = slide?.type === "finale" && !revealed;
  const showNaming = revealed;

  return (
    <div className="grid min-h-[calc(100vh-5rem)] gap-8 lg:grid-cols-[1fr_340px]">
      <div
        className={cn(
          "flex flex-col transition-opacity duration-300",
          animating ? "opacity-0" : "opacity-100"
        )}
      >
        {showNaming ? (
          <NamingPanel
            suggestedName={suggestedName}
            companionName={companionName}
            setCompanionName={setCompanionName}
            loading={loading}
            onContinue={finishNaming}
          />
        ) : showFinale ? (
          <FinalePanel
            consent={consent}
            setConsent={setConsent}
            error={error}
            loading={loading}
            allAnswered={BFI2_SHORT_ITEMS.every((i) => answers[i.id] != null)}
            onSubmit={submitAndReveal}
          />
        ) : (
          <SlideContent
            slide={slide}
            onContinue={() => goNext(0)}
            onPick={pickAnswer}
          />
        )}

        {!showNaming && !showFinale ? (
          <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
            <span>
              {slideIndex + 1} / {slides.length}
            </span>
            {slideIndex > 0 ? (
              <button
                type="button"
                className="hover:text-violet-300"
                onClick={() => setSlideIndex((i) => Math.max(0, i - 1))}
              >
                Back
              </button>
            ) : (
              <span />
            )}
          </div>
        ) : null}
      </div>

      <div className="lg:sticky lg:top-8 lg:self-start">
        <ElyFaceReveal
          progress={progress}
          revealed={revealed}
          scores={scores}
          companionName={
            revealed ? companionName.trim() || suggestedName : null
          }
        />
      </div>
    </div>
  );
}

function SlideContent({
  slide,
  onContinue,
  onPick,
}: {
  slide: JourneySlide | undefined;
  onContinue: () => void;
  onPick: (itemId: number, value: number) => void;
}) {
  if (!slide) return null;

  if (slide.type === "intro") {
    return (
      <div className="flex flex-1 flex-col justify-center space-y-6">
        <p className="text-sm font-medium uppercase tracking-widest text-violet-400">
          Awakening
        </p>
        <h1 className="text-4xl font-bold leading-tight text-white">
          Every choice draws your ELY from the mist
        </h1>
        <p className="max-w-lg text-lg text-slate-400">
          Thirty moments — each with a short story. Watch the portrait on the right
          sharpen as you answer. Nothing is stored except your final trait scores.
        </p>
        <Button size="lg" className="w-fit" onClick={onContinue}>
          Begin the journey
        </Button>
      </div>
    );
  }

  if (slide.type === "bridge") {
    const chapter = BRIDGE_CHAPTERS[slide.chapter];
    return (
      <div className="flex flex-1 flex-col justify-center space-y-6 rounded-2xl border border-violet-500/30 bg-violet-500/10 p-8">
        <p className="text-sm text-violet-300">{chapter.title}</p>
        <p className="text-2xl font-medium leading-relaxed text-white">{chapter.body}</p>
        <p className="text-slate-400">The face on the right grows clearer…</p>
        <Button className="w-fit" onClick={onContinue}>
          Continue
        </Button>
      </div>
    );
  }

  if (slide.type === "question") {
    const { item } = slide;
    const scene = sceneForItem(item);
    return (
      <div className="flex flex-1 flex-col space-y-5">
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-white/10">
          <Image
            src={scene.image}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 60vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
          <p className="absolute bottom-4 left-4 right-4 text-sm italic text-violet-100/90">
            {scene.mood}
          </p>
        </div>

        <div>
          <p className="text-xs text-violet-400">Moment {item.id} of 30</p>
          <h2 className="mt-1 text-xl font-semibold text-white">{item.text}</h2>
          <p className="mt-2 text-sm text-slate-400">{questionStory(item)}</p>
        </div>

        <div className="grid gap-2 sm:grid-cols-1">
          {([1, 2, 3, 4, 5] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onPick(item.id, v)}
              className="group rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:border-violet-500/50 hover:bg-violet-500/10"
            >
              <span className="text-xs text-violet-400">Choice {v}</span>
              <p className="mt-0.5 text-sm text-slate-200 group-hover:text-white">
                {choiceStory(item, v)}
              </p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

function FinalePanel({
  consent,
  setConsent,
  error,
  loading,
  allAnswered,
  onSubmit,
}: {
  consent: boolean;
  setConsent: (v: boolean) => void;
  error: string | null;
  loading: boolean;
  allAnswered: boolean;
  onSubmit: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col justify-center space-y-6">
      <h2 className="text-3xl font-bold text-white">The portrait is ready</h2>
      <p className="text-slate-400">
        One last step — confirm how we use your scores, then ELY&apos;s face will
        fully appear.
      </p>
      <label className="flex gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
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
        size="lg"
        disabled={!allAnswered || !consent || loading}
        onClick={onSubmit}
      >
        {loading ? "Revealing your ELY…" : "Reveal ELY"}
      </Button>
    </div>
  );
}

function NamingPanel({
  suggestedName,
  companionName,
  setCompanionName,
  loading,
  onContinue,
}: {
  suggestedName: string;
  companionName: string;
  setCompanionName: (v: string) => void;
  loading: boolean;
  onContinue: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col justify-center space-y-6">
      <h2 className="text-3xl font-bold text-white">Name your ELY</h2>
      <p className="text-slate-400">
        We suggested a name from your personality snapshot. Keep it or choose your
        own.
      </p>
      <div className="space-y-3">
        <label className="block text-sm text-slate-300">ELY&apos;s name</label>
        <input
          value={companionName}
          onChange={(e) => setCompanionName(e.target.value)}
          placeholder={suggestedName}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none"
        />
        <button
          type="button"
          className="text-sm text-violet-400 hover:underline"
          onClick={() => setCompanionName(suggestedName)}
        >
          Use suggested name: {suggestedName}
        </button>
      </div>
      <Button size="lg" onClick={onContinue} disabled={loading}>
        {loading ? "Saving…" : "Meet your ELY"}
      </Button>
    </div>
  );
}
