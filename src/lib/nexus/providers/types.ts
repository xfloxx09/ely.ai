export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type NexusStreamResult = {
  stream: AsyncIterable<string>;
  provider: string;
  model: string;
};
