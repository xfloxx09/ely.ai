import { Plan } from "@prisma/client";
import { db } from "@/lib/db";
import { currentPeriod } from "@/lib/utils";

export type NexusProvider = "openai" | "anthropic" | "google";

export type NexusCommand = {
  provider: NexusProvider;
  model: string;
};

const MODEL_ALIASES: Record<string, { provider: NexusProvider; model: string }> =
  {
    "gpt-4o": { provider: "openai", model: "gpt-4o" },
    "gpt-4o-mini": { provider: "openai", model: "gpt-4o-mini" },
    claude: { provider: "anthropic", model: "claude-3-5-sonnet-latest" },
    gemini: { provider: "google", model: "gemini-1.5-pro" },
  };

export function parseNexusCommand(input: string): NexusCommand | null {
  const match = input.trim().match(/^\/model\s+(\S+)/i);
  if (!match) return null;
  const key = match[1].toLowerCase();
  return MODEL_ALIASES[key] ?? { provider: "openai", model: key };
}

export async function checkNexusQuota(
  userId: string,
  plan: Plan
): Promise<{ allowed: boolean; remaining: number | null; message?: string }> {
  if (plan === "PRO") {
    const hasKey = await db.userApiKey.findFirst({ where: { userId } });
    if (!hasKey) {
      return {
        allowed: false,
        remaining: null,
        message:
          "Model Nexus on Pro requires your API keys in Settings (coming soon). Using ELY core for now.",
      };
    }
    return { allowed: true, remaining: null };
  }

  if (plan !== "PLUS") {
    return {
      allowed: false,
      remaining: 0,
      message: "Model Nexus is available on Ely Plus and Pro.",
    };
  }

  const limit = Number(process.env.NEXUS_PLUS_MONTHLY_LIMIT ?? 100);
  const period = currentPeriod();
  const usage = await db.nexusUsage.upsert({
    where: { userId_period: { userId, period } },
    create: { userId, period, requestCount: 0 },
    update: {},
  });

  if (usage.requestCount >= limit) {
    return {
      allowed: false,
      remaining: 0,
      message: `Monthly Nexus limit reached (${limit}). Upgrade to Pro for BYOK unlimited.`,
    };
  }

  await db.nexusUsage.update({
    where: { userId_period: { userId, period } },
    data: { requestCount: { increment: 1 } },
  });

  return { allowed: true, remaining: limit - usage.requestCount - 1 };
}

export async function routeNexusRequest(
  _command: NexusCommand,
  _messages: { role: string; content: string }[],
  _styleSummary: string
): Promise<{ ok: false; message: string }> {
  return {
    ok: false,
    message:
      "Model Nexus multi-provider routing launches in Phase 2. ELY core is handling this message with your personality context.",
  };
}
