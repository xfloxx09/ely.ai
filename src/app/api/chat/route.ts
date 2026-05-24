import { auth } from "@/auth";
import { db } from "@/lib/db";
import { streamChatCompletion } from "@/lib/ai/router";
import { buildPersonaSystemPrompt } from "@/lib/ai/persona-prompt";
import { checkAndIncrementUsage, incrementDailyQuest } from "@/lib/ai/usage";
import { effectivePlanForUser } from "@/lib/auth-utils";
import { normalizeModule, MODULE_META } from "@/lib/ai/modules";
import { getRelevantMemories, extractMemoryFact } from "@/lib/memory/store";
import {
  parseNexusCommand,
  stripNexusCommand,
  checkNexusAccess,
  streamNexusCompletion,
} from "@/lib/nexus/router";
import { syncEvolutionStage } from "@/lib/avatar/evolution";
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
    const access = await checkNexusAccess(
      session.user.id,
      plan,
      nexusCmd.provider
    );
    if (!access.allowed) {
      return new Response(
        JSON.stringify({ error: access.message, remaining: access.remaining }),
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

  const styleSummary = user?.personaSettings?.shareTraitsWithNexus
    ? user?.personaSettings?.communicationStyleSummary
    : user?.personaSettings?.communicationStyleSummary
      ? "Adaptive companion tone (trait scores private)"
      : user?.personaSettings?.communicationStyleSummary;

  const system = buildPersonaSystemPrompt({
    plan,
    module,
    scores,
    optOut: user?.personaSettings?.optOutPersonalization,
    toneOverride: user?.personaSettings?.toneOverride,
    memories,
    styleSummary,
  });

  const cleanMessages = body.data.messages.map((m, i, arr) => {
    if (m.role === "user" && i === arr.length - 1 && nexusCmd) {
      const stripped = stripNexusCommand(m.content);
      return { ...m, content: stripped || m.content };
    }
    return m;
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
    await syncEvolutionStage(session.user.id);
  }

  const encoder = new TextEncoder();
  let full = "";
  let prefix = "";
  if (!meta.live) {
    prefix = `[${meta.label} is in preview — core features coming soon.]\n\n`;
  }

  const readable = new ReadableStream({
    async start(controller) {
      try {
        if (prefix) {
          full += prefix;
          controller.enqueue(encoder.encode(prefix));
        }

        if (nexusCmd) {
          const nexus = await streamNexusCompletion({
            userId: session.user.id,
            plan,
            command: nexusCmd,
            system,
            messages: cleanMessages,
          });
          const header = `[Model Nexus · ${nexus.provider}/${nexus.model} via ${nexus.via}]\n\n`;
          full += header;
          controller.enqueue(encoder.encode(header));

          for await (const text of nexus.stream) {
            full += text;
            controller.enqueue(encoder.encode(text));
          }
        } else {
          const stream = await streamChatCompletion({
            plan,
            module,
            messages: cleanMessages,
            scores,
            optOut: user?.personaSettings?.optOutPersonalization,
            toneOverride: user?.personaSettings?.toneOverride,
            memories,
            styleSummary: user?.personaSettings?.communicationStyleSummary,
          });
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content ?? "";
            if (text) {
              full += text;
              controller.enqueue(encoder.encode(text));
            }
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
              stripNexusCommand(lastUserMsg),
              full,
              plan
            );
          }
        }
        controller.close();
      } catch (e) {
        console.error("Stream error:", e);
        const msg =
          e instanceof Error ? e.message : "ELY could not complete this request.";
        controller.enqueue(encoder.encode(`\n\n[Error: ${msg}]`));
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Ely-Remaining":
        usage.remaining === null ? "unlimited" : String(usage.remaining),
      ...(nexusCmd ? { "X-Ely-Nexus": "1" } : {}),
    },
  });
}
