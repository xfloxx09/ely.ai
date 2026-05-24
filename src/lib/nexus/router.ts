import { Plan } from "@prisma/client";
import { db } from "@/lib/db";
import { currentPeriod } from "@/lib/utils";
import { decryptSecret } from "@/lib/crypto/secrets";
import { deductNexusCredit, getCreditBalance } from "./credits";
import { streamOpenAI } from "./providers/openai";
import { streamAnthropic } from "./providers/anthropic";
import { streamGoogle } from "./providers/google";
import type { ChatMessage } from "./providers/types";

export type NexusProvider = "openai" | "anthropic" | "google";

export type NexusCommand = {
  provider: NexusProvider;
  model: string;
};

const MODEL_ALIASES: Record<string, { provider: NexusProvider; model: string }> =
  {
    "gpt-4o": { provider: "openai", model: "gpt-4o" },
    "gpt-4o-mini": { provider: "openai", model: "gpt-4o-mini" },
    claude: { provider: "anthropic", model: "claude-3-5-sonnet-20241022" },
    "claude-sonnet": { provider: "anthropic", model: "claude-3-5-sonnet-20241022" },
    gemini: { provider: "google", model: "gemini-1.5-flash" },
    "gemini-pro": { provider: "google", model: "gemini-1.5-pro" },
  };

export function parseNexusCommand(input: string): NexusCommand | null {
  const match = input.trim().match(/^\/model\s+(\S+)/i);
  if (!match) return null;
  const key = match[1].toLowerCase();
  return MODEL_ALIASES[key] ?? { provider: "openai", model: key };
}

export function stripNexusCommand(content: string): string {
  return content.replace(/^\/model\s+\S+\s*/i, "").trim();
}

async function platformKey(provider: NexusProvider): Promise<string | null> {
  if (provider === "openai") return process.env.OPENAI_API_KEY ?? null;
  if (provider === "anthropic") return process.env.ANTHROPIC_API_KEY ?? null;
  if (provider === "google") return process.env.GOOGLE_AI_API_KEY ?? null;
  return null;
}

export async function getUserProviderKey(
  userId: string,
  provider: NexusProvider
): Promise<string | null> {
  const row = await db.userApiKey.findUnique({
    where: { userId_provider: { userId, provider } },
  });
  if (!row) return null;
  return decryptSecret(row.encryptedKey);
}

export type NexusAccess =
  | { allowed: true; mode: "byok" | "platform" | "credits"; remaining: number | null }
  | { allowed: false; remaining: number | null; message: string };

export async function checkNexusAccess(
  userId: string,
  plan: Plan,
  provider: NexusProvider
): Promise<NexusAccess> {
  if (plan === "FREE") {
    return {
      allowed: false,
      remaining: 0,
      message: "Model Nexus requires Ely Plus or Pro.",
    };
  }

  const userKey = await getUserProviderKey(userId, provider);
  if (userKey) {
    return { allowed: true, mode: "byok", remaining: null };
  }

  if (plan === "PRO") {
    const credits = await getCreditBalance(userId);
    if (credits > 0) {
      return { allowed: true, mode: "credits", remaining: credits };
    }
    const platform = await platformKey(provider);
    if (platform) {
      return { allowed: true, mode: "platform", remaining: null };
    }
    return {
      allowed: false,
      remaining: 0,
      message:
        "Add your API key in Settings, buy Ely Credits, or set platform keys (ANTHROPIC_API_KEY / GOOGLE_AI_API_KEY).",
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
      message: `Plus Nexus limit reached (${limit}/mo). Upgrade to Pro for BYOK + credits.`,
    };
  }

  const platform = await platformKey(provider);
  if (!platform) {
    return {
      allowed: false,
      remaining: 0,
      message: `Platform ${provider} key not configured on server.`,
    };
  }

  return {
    allowed: true,
    mode: "platform",
    remaining: limit - usage.requestCount,
  };
}

export async function consumeNexusAccess(
  userId: string,
  plan: Plan,
  access: NexusAccess & { allowed: true }
): Promise<void> {
  if (access.mode === "credits") {
    await deductNexusCredit(userId, "Model Nexus request");
    return;
  }
  if (plan === "PLUS" && access.mode === "platform") {
    const period = currentPeriod();
    await db.nexusUsage.update({
      where: { userId_period: { userId, period } },
      data: { requestCount: { increment: 1 } },
    });
  }
}

export async function streamNexusCompletion(params: {
  userId: string;
  plan: Plan;
  command: NexusCommand;
  system: string;
  messages: ChatMessage[];
}): Promise<{
  stream: AsyncIterable<string>;
  provider: string;
  model: string;
  via: string;
}> {
  const access = await checkNexusAccess(
    params.userId,
    params.plan,
    params.command.provider
  );
  if (!access.allowed) {
    throw new Error(access.message);
  }

  let apiKey: string | null = null;
  let via = access.mode;

  if (access.mode === "byok") {
    apiKey = await getUserProviderKey(params.userId, params.command.provider);
  } else if (access.mode === "credits" || access.mode === "platform") {
    apiKey = await platformKey(params.command.provider);
  }

  if (!apiKey) {
    throw new Error("No API key available for this provider.");
  }

  await consumeNexusAccess(params.userId, params.plan, access);

  let result;
  if (params.command.provider === "anthropic") {
    result = await streamAnthropic(
      apiKey,
      params.command.model,
      params.system,
      params.messages
    );
  } else if (params.command.provider === "google") {
    result = await streamGoogle(
      apiKey,
      params.command.model,
      params.system,
      params.messages
    );
  } else {
    result = await streamOpenAI(
      apiKey,
      params.command.model,
      params.system,
      params.messages
    );
  }

  return { ...result, via };
}

/** @deprecated use checkNexusAccess */
export async function checkNexusQuota(
  userId: string,
  plan: Plan
): Promise<{ allowed: boolean; remaining: number | null; message?: string }> {
  const access = await checkNexusAccess(userId, plan, "openai");
  if (!access.allowed) {
    return {
      allowed: false,
      remaining: access.remaining,
      message: access.message,
    };
  }
  return { allowed: true, remaining: access.remaining };
}
