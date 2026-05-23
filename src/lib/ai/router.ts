import { Plan } from "@prisma/client";
import { AiModule } from "@prisma/client";
import OpenAI from "openai";
import { CONCIERGE_SYSTEM_PROMPT } from "./modules/concierge";
import { CONTENT_SYSTEM_PROMPT } from "./modules/content";

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");
  return new OpenAI({ apiKey });
}

export function modelForPlan(plan: Plan): string {
  if (plan === "PRO") return process.env.OPENAI_MODEL_PRO ?? "gpt-4o";
  return process.env.OPENAI_MODEL_DEFAULT ?? "gpt-4o-mini";
}

export function systemPromptForModule(module: AiModule): string {
  return module === "CONCIERGE"
    ? CONCIERGE_SYSTEM_PROMPT
    : CONTENT_SYSTEM_PROMPT;
}

export async function streamChatCompletion(params: {
  plan: Plan;
  module: AiModule;
  messages: { role: "user" | "assistant" | "system"; content: string }[];
}) {
  const model = modelForPlan(params.plan);

  return getOpenAI().chat.completions.create({
    model,
    stream: true,
    messages: [
      { role: "system", content: systemPromptForModule(params.module) },
      ...params.messages.filter((m) => m.role !== "system"),
    ],
  });
}
