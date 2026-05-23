import { auth } from "@/auth";
import { db } from "@/lib/db";
import { streamChatCompletion } from "@/lib/ai/router";
import { checkAndIncrementUsage, incrementDailyQuest } from "@/lib/ai/usage";
import { AiModule } from "@prisma/client";
import { z } from "zod";

const schema = z.object({
  module: z.enum(["CONCIERGE", "CONTENT"]),
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

  const sub = await db.subscription.findUnique({
    where: { userId: session.user.id },
  });
  const plan = sub?.plan ?? "FREE";

  const usage = await checkAndIncrementUsage(session.user.id, plan);
  if (!usage.allowed) {
    return new Response(
      JSON.stringify({
        error: "Daily message limit reached. Upgrade to Ely Plus for unlimited access.",
        remaining: 0,
      }),
      { status: 429 }
    );
  }

  const stream = await streamChatCompletion({
    plan,
    module: body.data.module as AiModule,
    messages: body.data.messages,
  });

  const lastUser = body.data.messages.filter((m) => m.role === "user").pop();
  if (lastUser) {
    await db.chatMessage.create({
      data: {
        userId: session.user.id,
        module: body.data.module as AiModule,
        role: "user",
        content: lastUser.content,
      },
    });
    await incrementDailyQuest(session.user.id);
  }

  const encoder = new TextEncoder();
  let full = "";

  const readable = new ReadableStream({
    async start(controller) {
      try {
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
              module: body.data.module as AiModule,
              role: "assistant",
              content: full,
            },
          });
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
