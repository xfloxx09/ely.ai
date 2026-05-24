import { AiModule, Plan } from "@prisma/client";
import OpenAI from "openai";
import { buildPersonaSystemPrompt } from "./persona-prompt";
import { normalizeModule } from "./modules";
import type { BigFiveScores } from "@/lib/personality/scoring";

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");
  return new OpenAI({ apiKey });
}

export function modelForPlan(plan: Plan): string {
  if (plan === "PRO") return process.env.OPENAI_MODEL_PRO ?? "gpt-4o";
  return process.env.OPENAI_MODEL_DEFAULT ?? "gpt-4o-mini";
}

export async function streamChatCompletion(params: {
  plan: Plan;
  module: AiModule;
  messages: { role: "user" | "assistant" | "system"; content: string }[];
  scores?: BigFiveScores | null;
  optOut?: boolean;
  toneOverride?: string | null;
  memories?: string[];
  styleSummary?: string | null;
}) {
  const model = modelForPlan(params.plan);
  const module = normalizeModule(params.module);

  const system = buildPersonaSystemPrompt({
    plan: params.plan,
    module,
    scores: params.scores,
    optOut: params.optOut,
    toneOverride: params.toneOverride,
    memories: params.memories,
    styleSummary: params.styleSummary,
  });

  return getOpenAI().chat.completions.create({
    model,
    stream: true,
    messages: [
      { role: "system", content: system },
      ...params.messages.filter((m) => m.role !== "system"),
    ],
  });
}
