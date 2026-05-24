import type { BigFiveScores } from "./scoring";

type TraitKey = keyof BigFiveScores;

const POOLS: Record<TraitKey, string[]> = {
  openness: ["Nova", "Lyra", "Pixel", "Wren", "Indigo"],
  conscientiousness: ["Sage", "Atlas", "Harbor", "Quill", "Sterling"],
  extraversion: ["Blaze", "Sunny", "Rio", "Echo", "Zest"],
  agreeableness: ["Haven", "Mira", "Blossom", "Elm", "Clover"],
  neuroticism: ["Still", "Mist", "Calm", "Drift", "Lumen"],
};

export function generateCompanionName(scores: BigFiveScores): string {
  const entries: [TraitKey, number][] = [
    ["openness", scores.openness],
    ["conscientiousness", scores.conscientiousness],
    ["extraversion", scores.extraversion],
    ["agreeableness", scores.agreeableness],
    ["neuroticism", scores.neuroticism],
  ];
  entries.sort((a, b) => b[1] - a[1]);

  const dominant = entries[0][0];
  const pool = POOLS[dominant];
  return pool[Math.floor(entries[0][1] / 25) % pool.length];
}
