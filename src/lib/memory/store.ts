import { db } from "@/lib/db";
import { Plan } from "@prisma/client";
import OpenAI from "openai";

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

export async function getRelevantMemories(
  userId: string,
  query: string,
  limit = 5
): Promise<string[]> {
  const entries = await db.memoryEntry.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: { content: true },
  });

  if (entries.length === 0) return [];

  const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 3);
  const scored = entries.map((e) => {
    const lower = e.content.toLowerCase();
    const score = terms.reduce((s, t) => (lower.includes(t) ? s + 1 : s), 0);
    return { content: e.content, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.content);
}

export async function extractMemoryFact(
  userId: string,
  userMessage: string,
  assistantReply: string,
  plan: Plan
): Promise<void> {
  if (plan !== "PRO") return;

  const openai = getOpenAI();
  if (!openai) return;

  try {
    const res = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL_DEFAULT ?? "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Extract ONE short memorable fact about the user from this exchange (preference, upcoming event, goal). If nothing worth remembering, reply with exactly NONE. Max 120 chars.",
        },
        {
          role: "user",
          content: `User: ${userMessage}\nAssistant: ${assistantReply}`,
        },
      ],
      max_tokens: 60,
    });

    const fact = res.choices[0]?.message?.content?.trim();
    if (!fact || fact === "NONE" || fact.length < 5) return;

    await db.memoryEntry.create({
      data: { userId, content: fact, type: "FACT" },
    });
  } catch {
    // non-blocking
  }
}
