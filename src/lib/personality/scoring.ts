import { BFI2_SHORT_ITEMS } from "./bfi2-short";

export type BigFiveScores = {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
};

const TRAIT_KEYS = {
  O: "openness",
  C: "conscientiousness",
  E: "extraversion",
  A: "agreeableness",
  N: "neuroticism",
} as const;

export function scoreBfi2Short(
  answers: Record<number, number>
): BigFiveScores {
  const sums: Record<string, number[]> = {
    openness: [],
    conscientiousness: [],
    extraversion: [],
    agreeableness: [],
    neuroticism: [],
  };

  for (const item of BFI2_SHORT_ITEMS) {
    const raw = answers[item.id];
    if (raw == null || raw < 1 || raw > 5) continue;
    const scored = item.reverse ? 6 - raw : raw;
    const key = TRAIT_KEYS[item.trait];
    sums[key].push(scored);
  }

  const toPercent = (values: number[]) => {
    if (values.length === 0) return 50;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return Math.round(((avg - 1) / 4) * 100);
  };

  return {
    openness: toPercent(sums.openness),
    conscientiousness: toPercent(sums.conscientiousness),
    extraversion: toPercent(sums.extraversion),
    agreeableness: toPercent(sums.agreeableness),
    neuroticism: toPercent(sums.neuroticism),
  };
}

export function traitLabels(scores: BigFiveScores) {
  return [
    { name: "Openness", value: scores.openness, desc: "Creativity & curiosity" },
    {
      name: "Conscientiousness",
      value: scores.conscientiousness,
      desc: "Structure & discipline",
    },
    {
      name: "Extraversion",
      value: scores.extraversion,
      desc: "Energy & sociability",
    },
    {
      name: "Agreeableness",
      value: scores.agreeableness,
      desc: "Warmth & cooperation",
    },
    {
      name: "Emotional sensitivity",
      value: scores.neuroticism,
      desc: "Calm vs. reactive (not a diagnosis)",
    },
  ];
}

export function buildStyleSummary(scores: BigFiveScores): string {
  const parts: string[] = [];
  if (scores.openness >= 65) parts.push("creative and exploratory");
  else if (scores.openness <= 35) parts.push("practical and concrete");

  if (scores.conscientiousness >= 65) parts.push("structured and detail-oriented");
  else if (scores.conscientiousness <= 35) parts.push("flexible and spontaneous");

  if (scores.extraversion >= 65) parts.push("energetic and conversational");
  else if (scores.extraversion <= 35) parts.push("reserved and concise");

  if (scores.agreeableness >= 65) parts.push("warm and affirming");
  else if (scores.agreeableness <= 35) parts.push("direct and candid");

  if (scores.neuroticism >= 65) parts.push("calm and steady under stress");
  else if (scores.neuroticism <= 35) parts.push("emotionally attentive");

  return parts.join("; ") || "balanced and adaptive";
}
