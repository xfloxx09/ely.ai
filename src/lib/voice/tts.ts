import type { BigFiveScores } from "@/lib/personality/scoring";

export type VoiceParams = {
  voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
  speed: number;
};

/** Trait-modulated OpenAI TTS parameters (Phase 2 voice stub). */
export function traitToVoiceParams(scores?: BigFiveScores | null): VoiceParams {
  if (!scores) {
    return { voice: "nova", speed: 1 };
  }

  let voice: VoiceParams["voice"] = "nova";
  if (scores.extraversion > 65) voice = "shimmer";
  else if (scores.extraversion < 35) voice = "onyx";
  else if (scores.agreeableness > 65) voice = "fable";
  else if (scores.openness > 65) voice = "echo";

  const speed =
    0.85 +
    (scores.extraversion / 100) * 0.2 -
    (scores.neuroticism / 100) * 0.1;

  return {
    voice,
    speed: Math.min(1.15, Math.max(0.85, speed)),
  };
}

export async function synthesizeSpeech(
  text: string,
  params: VoiceParams,
  apiKey?: string
): Promise<ArrayBuffer> {
  const key = apiKey ?? process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY not configured for voice");

  const trimmed = text.slice(0, 4096);
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "tts-1",
      input: trimmed,
      voice: params.voice,
      speed: params.speed,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`TTS failed: ${err}`);
  }

  return res.arrayBuffer();
}
