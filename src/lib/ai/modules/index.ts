import { AiModule } from "@prisma/client";
import { CONCIERGE_SYSTEM_PROMPT } from "./concierge";
import { SCRIBE_SYSTEM_PROMPT } from "./scribe";
import { KITCHEN_SYSTEM_PROMPT } from "./kitchen";
import { HABIT_SYSTEM_PROMPT } from "./habit";
import { RESEARCHER_SYSTEM_PROMPT } from "./researcher";
import { MONEY_SYSTEM_PROMPT } from "./money";

export const LIVE_MODULES: AiModule[] = ["CONCIERGE", "SCRIBE"];

export const MODULE_META: Record<
  AiModule,
  { label: string; live: boolean; description: string }
> = {
  CONCIERGE: {
    label: "Concierge",
    live: true,
    description: "Schedules, reminders, and day planning",
  },
  SCRIBE: {
    label: "Scribe",
    live: true,
    description: "Emails, posts, and copy in your voice",
  },
  CONTENT: {
    label: "Scribe",
    live: true,
    description: "Legacy alias for Scribe",
  },
  KITCHEN: {
    label: "Kitchen Brain",
    live: false,
    description: "Meals and shopping lists",
  },
  HABIT: {
    label: "Habit Coach",
    live: false,
    description: "Habits and accountability",
  },
  RESEARCHER: {
    label: "Researcher",
    live: false,
    description: "Learn and summarize",
  },
  MONEY: {
    label: "Money Scout",
    live: false,
    description: "Budgets and savings",
  },
};

export function normalizeModule(module: AiModule): AiModule {
  if (module === "CONTENT") return "SCRIBE";
  return module;
}

export function systemPromptForModule(module: AiModule): string {
  const m = normalizeModule(module);
  switch (m) {
    case "CONCIERGE":
      return CONCIERGE_SYSTEM_PROMPT;
    case "SCRIBE":
      return SCRIBE_SYSTEM_PROMPT;
    case "KITCHEN":
      return KITCHEN_SYSTEM_PROMPT;
    case "HABIT":
      return HABIT_SYSTEM_PROMPT;
    case "RESEARCHER":
      return RESEARCHER_SYSTEM_PROMPT;
    case "MONEY":
      return MONEY_SYSTEM_PROMPT;
    default:
      return CONCIERGE_SYSTEM_PROMPT;
  }
}
