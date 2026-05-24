import { auth } from "@/auth";
import { db } from "@/lib/db";
import { streamChatCompletion } from "@/lib/ai/router";
import { checkAndIncrementUsage, incrementDailyQuest } from "@/lib/ai/usage";
import { effectivePlanForUser } from "@/lib/auth-utils";
import { normalizeModule, MODULE_META } from "@/lib/ai/modules";
import { getRelevantMemories, extractMemoryFact } from "@/lib/memory/store";
import { parseNexusCommand, checkNexusQuota } from "@/lib/nexus/router";
import { AiModule } from "@prisma/client";
import { z } from "zod";

const MODULES = [
  "CONCIERGE",
  "SCRIBE",
  "CONTENT",
  "KITCHEN",
  "HABIT",
  "RESEARCHER",
  "MONEY",
] as const;

const schema = z.object({
  module: z.enum(MODULES),
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    })
  ),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({ error: "OpenAI API key not configured" }),
      { status: 503 }
    );
  }

  const body = schema.safeParse(await req.json());
  if (!body.success) {
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
    });
  }

  const module = normalizeModule(body.data.module as AiModule);
  const meta = MODULE_META[module];

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      subscription: true,
      personalityProfile: true,
      personaSettings: true,
      avatarProfile: true,
    },
  });

  const plan = effectivePlanForUser(
    user?.subscription?.plan ?? "FREE",
    user?.role
  );

  const lastUserMsg =
    body.data.messages.filter((m) => m.role === "user").pop()?.content ?? "";

  const nexusCmd = parseNexusCommand(lastUserMsg);
  if (nexusCmd) {
    const quota = await checkNexusQuota(session.user.id, plan);
    if (!quota.allowed) {
      return new Response(
        JSON.stringify({ error: quota.message, remaining: quota.remaining }),
        { status: 402 }
      );
    }
  }

  const usage = await checkAndIncrementUsage(session.user.id, plan);
  if (!usage.allowed) {
    return new Response(
      JSON.stringify({
        error:
          "Daily message limit reached (20/day on Free). Upgrade to Ely Plus for unlimited chat.",
        remaining: 0,
      }),
      { status: 429 }
    );
  }

  const scores = user?.personalityProfile
    ? {
        openness: user.personalityProfile.openness,
        conscientiousness: user.personalityProfile.conscientiousness,
        extraversion: user.personalityProfile.extraversion,
        agreeableness: user.personalityProfile.agreeableness,
        neuroticism: user.personalityProfile.neuroticism,
      }
    : null;

  const memories =
    plan === "PRO" && lastUserMsg
      ? await getRelevantMemories(session.user.id, lastUserMsg)
      : [];

  const stream = await streamChatCompletion({
    plan,
    module,
    messages: body.data.messages,
    scores,
    optOut: user?.personaSettings?.optOutPersonalization,
    toneOverride: user?.personaSettings?.toneOverride,
    memories,
    styleSummary: user?.personaSettings?.communicationStyleSummary,
  });

  if (lastUserMsg) {
    await db.chatMessage.create({
      data: {
        userId: session.user.id,
        module,
        role: "user",
        content: lastUserMsg,
      },
    });
    await incrementDailyQuest(session.user.id);

    if (!meta.live) {
      // still count usage; module stub responds via prompt
    }
  }

  const encoder = new TextEncoder();
  let full = "";
  let prefix = "";
  if (!meta.live) {
    prefix = `[${meta.label} is in preview — core features coming soon.]\n\n`;
  }
  if (nexusCmd) {
    prefix += `[Model Nexus: requested ${nexusCmd.model} — routing expands in Phase 2.]\n\n`;
  }

  const readable = new ReadableStream({
    async start(controller) {
      try {
        if (prefix) {
          full += prefix;
          controller.enqueue(encoder.encode(prefix));
        }
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? "";
          if (text) {
            full += text;
            controller.enqueue(encoder.encode(text));
          }
        }
        if (full) {
          await db.chatMessage.create({
            data: {
              userId: session.user.id,
              module,
              role: "assistant",
              content: full,
            },
          });
          if (lastUserMsg) {
            await extractMemoryFact(
              session.user.id,
              lastUserMsg,
              full,
              plan
            );
          }
        }
        controller.close();
      } catch (e) {
        console.error("Stream error:", e);
        controller.error(e);
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Ely-Remaining":
        usage.remaining === null ? "unlimited" : String(usage.remaining),
    },
  });
}
