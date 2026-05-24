import type { ChatMessage, NexusStreamResult } from "./types";

export async function streamAnthropic(
  apiKey: string,
  model: string,
  system: string,
  messages: ChatMessage[]
): Promise<NexusStreamResult> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: model.includes("claude") ? model : "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
      stream: true,
      system,
      messages: messages
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content,
        })),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic error: ${err}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No Anthropic stream");
  const bodyReader = reader;

  async function* iterate() {
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await bodyReader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") return;
        try {
          const json = JSON.parse(data) as {
            type?: string;
            delta?: { type?: string; text?: string };
          };
          if (
            json.type === "content_block_delta" &&
            json.delta?.type === "text_delta" &&
            json.delta.text
          ) {
            yield json.delta.text;
          }
        } catch {
          // skip malformed SSE
        }
      }
    }
  }

  return { stream: iterate(), provider: "anthropic", model };
}
