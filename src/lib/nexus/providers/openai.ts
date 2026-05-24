import OpenAI from "openai";
import type { ChatMessage, NexusStreamResult } from "./types";

export async function streamOpenAI(
  apiKey: string,
  model: string,
  system: string,
  messages: ChatMessage[]
): Promise<NexusStreamResult> {
  const client = new OpenAI({ apiKey });
  const completion = await client.chat.completions.create({
    model,
    stream: true,
    messages: [
      { role: "system", content: system },
      ...messages.filter((m) => m.role !== "system"),
    ],
  });

  async function* iterate() {
    for await (const chunk of completion) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) yield text;
    }
  }

  return { stream: iterate(), provider: "openai", model };
}
