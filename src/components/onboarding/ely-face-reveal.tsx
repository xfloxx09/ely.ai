"use client";

import { traitToAvatarColors } from "@/lib/avatar/rpm";
import type { BigFiveScores } from "@/lib/personality/scoring";
import { cn } from "@/lib/utils";

const LAYER_COUNT = 10;

export function ElyFaceReveal({
  progress,
  revealed,
  scores,
  companionName,
}: {
  progress: number;
  revealed: boolean;
  scores?: BigFiveScores | null;
  companionName?: string | null;
}) {
  const p = Math.min(1, Math.max(0, progress));
  const activeLayers = revealed
    ? LAYER_COUNT
    : Math.max(1, Math.ceil(p * LAYER_COUNT));
  const blurPx = revealed ? 0 : Math.max(0, 22 - p * 22);
  const colors = scores
    ? traitToAvatarColors(scores)
    : { primary: "hsl(270, 70%, 55%)", accent: "hsl(320, 65%, 55%)", glow: 0.25 };

  return (
    <div className="relative flex h-full min-h-[320px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur-sm">
      <p className="mb-4 text-center text-xs uppercase tracking-widest text-violet-300/80">
        {revealed ? "Your ELY" : "Drawing your ELY…"}
      </p>

      <div
        className="relative transition-all duration-700 ease-out"
        style={{
          filter: `blur(${blurPx}px)`,
          opacity: revealed ? 1 : 0.35 + p * 0.65,
        }}
      >
        <svg
          viewBox="0 0 200 240"
          className="h-56 w-48 drop-shadow-2xl"
          aria-hidden
        >
          <defs>
            <linearGradient id="faceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.primary} />
              <stop offset="100%" stopColor={colors.accent} />
            </linearGradient>
            <radialGradient id="glowGrad" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="white" stopOpacity="0.35" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
          </defs>

          {activeLayers >= 1 ? (
            <ellipse cx="100" cy="120" rx="72" ry="88" fill="url(#faceGrad)" opacity="0.9" />
          ) : null}
          {activeLayers >= 2 ? (
            <ellipse cx="100" cy="115" rx="58" ry="70" fill="url(#glowGrad)" />
          ) : null}
          {activeLayers >= 3 ? (
            <>
              <ellipse cx="72" cy="108" rx="14" ry="10" fill="rgba(0,0,0,0.15)" />
              <ellipse cx="128" cy="108" rx="14" ry="10" fill="rgba(0,0,0,0.15)" />
            </>
          ) : null}
          {activeLayers >= 4 ? (
            <>
              <circle cx="72" cy="105" r="8" fill="#1e1b4b" />
              <circle cx="128" cy="105" r="8" fill="#1e1b4b" />
              <circle cx="74" cy="103" r="3" fill="white" opacity="0.9" />
              <circle cx="130" cy="103" r="3" fill="white" opacity="0.9" />
            </>
          ) : null}
          {activeLayers >= 5 ? (
            <>
              <path
                d="M 58 95 Q 72 88 86 95"
                stroke="#312e81"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M 114 95 Q 128 88 142 95"
                stroke="#312e81"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />
            </>
          ) : null}
          {activeLayers >= 6 ? (
            <ellipse cx="100" cy="125" rx="10" ry="14" fill="rgba(0,0,0,0.12)" />
          ) : null}
          {activeLayers >= 7 ? (
            <path
              d="M 82 148 Q 100 162 118 148"
              stroke="#4c1d95"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
            />
          ) : null}
          {activeLayers >= 8 ? (
            <>
              <ellipse cx="58" cy="130" rx="12" ry="8" fill="rgba(236,72,153,0.25)" />
              <ellipse cx="142" cy="130" rx="12" ry="8" fill="rgba(236,72,153,0.25)" />
            </>
          ) : null}
          {activeLayers >= 9 ? (
            <path
              d="M 40 75 Q 100 20 160 75 Q 130 45 100 50 Q 70 45 40 75"
              fill="url(#faceGrad)"
              opacity="0.95"
            />
          ) : null}
          {activeLayers >= 10 ? (
            <>
              <path
                d="M 55 195 Q 100 210 145 195 L 140 230 Q 100 240 60 230 Z"
                fill="url(#faceGrad)"
                opacity="0.85"
              />
              <ellipse
                cx="100"
                cy="200"
                rx="50"
                ry="8"
                fill="white"
                opacity={revealed ? 0.15 : 0.05}
              />
            </>
          ) : null}
        </svg>
      </div>

      <div
        className={cn(
          "mt-4 text-center transition-all duration-500",
          revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        )}
      >
        {companionName ? (
          <p className="text-2xl font-semibold text-white">{companionName}</p>
        ) : (
          <p className="text-sm text-slate-500">Almost visible…</p>
        )}
      </div>

      <div className="mt-6 w-full">
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500"
            style={{ width: `${p * 100}%` }}
          />
        </div>
        <p className="mt-2 text-center text-xs text-slate-500">
          {revealed ? "Portrait complete" : `${Math.round(p * 100)}% drawn`}
        </p>
      </div>
    </div>
  );
}
