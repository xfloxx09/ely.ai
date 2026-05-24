import type { ChatMessage, NexusStreamResult } from "./types";

export async function streamGoogle(
  apiKey: string,
  model: string,
  system: string,
  messages: ChatMessage[]
): Promise<NexusStreamResult> {
  const modelId = model.includes("gemini") ? model : "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:streamGenerateContent?alt=sse&key=${apiKey}`;

  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google AI error: ${err}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No Google stream");
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
        try {
          const json = JSON.parse(data) as {
            candidates?: { content?: { parts?: { text?: string }[] } }[];
          };
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) yield text;
        } catch {
          // skip
        }
      }
    }
  }

  return { stream: iterate(), provider: "google", model: modelId };
}
