import { AiModule, Plan } from "@prisma/client";
import type { BigFiveScores } from "@/lib/personality/scoring";
import { buildStyleSummary } from "@/lib/personality/scoring";
import { systemPromptForModule } from "./modules";

const NEUTRAL_ELY = `You are ELY — a personal AI companion at ely.ai. Be helpful, kind, and clear. You are not a therapist; encourage real human connection when appropriate.`;

export function buildPersonaSystemPrompt(params: {
  plan: Plan;
  module: AiModule;
  scores?: BigFiveScores | null;
  optOut?: boolean;
  toneOverride?: string | null;
  memories?: string[];
  styleSummary?: string | null;
}): string {
  const { plan, module, scores, optOut, toneOverride, memories, styleSummary } =
    params;

  const modulePrompt = systemPromptForModule(module);
  const parts: string[] = [NEUTRAL_ELY, modulePrompt];

  const canPersonalize =
    !optOut && scores && (plan === "PLUS" || plan === "PRO");

  if (canPersonalize) {
    const summary = styleSummary ?? buildStyleSummary(scores);
    parts.push(
      `## Personality-adapted communication
Adapt your tone to this user profile (Big Five scores 0-100):
- Openness: ${scores.openness}
- Conscientiousness: ${scores.conscientiousness}
- Extraversion: ${scores.extraversion}
- Agreeableness: ${scores.agreeableness}
- Emotional sensitivity: ${scores.neuroticism}

Style guide: ${summary}.
${scores.extraversion < 40 ? "Keep responses concise; avoid overwhelming with enthusiasm." : ""}
${scores.conscientiousness > 65 ? "Use clear structure, bullets, and actionable steps." : ""}
${scores.agreeableness > 65 ? "Be warm and affirming while staying honest." : ""}
${scores.neuroticism > 65 ? "Be calm, reassuring, and avoid alarmist language." : ""}
When asked to grow (e.g. be more assertive), gently coach without being preachy.`
    );
  } else if (plan === "FREE") {
    parts.push(
      `Use a friendly default persona. Do not reference stored personality data.`
    );
  }

  if (toneOverride) {
    parts.push(`User tone preference: ${toneOverride}`);
  }

  if (plan === "PRO" && memories && memories.length > 0) {
    parts.push(
      `## What you remember about this user\n${memories.map((m) => `- ${m}`).join("\n")}`
    );
  }

  if (scores && scores.neuroticism > 70) {
    parts.push(
      `Wellness note: Occasionally encourage breaks and connection with trusted people in real life.`
    );
  }

  return parts.join("\n\n");
}
