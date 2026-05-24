import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { effectivePlanForUser } from "@/lib/auth-utils";
import { traitToVoiceParams, synthesizeSpeech } from "@/lib/voice/tts";
import { z } from "zod";

const schema = z.object({
  text: z.string().min(1).max(2000),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      subscription: true,
      personalityProfile: true,
    },
  });
  const plan = effectivePlanForUser(
    user?.subscription?.plan ?? "FREE",
    user?.role
  );
  if (plan === "FREE") {
    return NextResponse.json(
      { error: "Voice mode requires Ely Plus or Pro" },
      { status: 403 }
    );
  }

  const body = schema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid text" }, { status: 400 });
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

  const params = traitToVoiceParams(scores);

  try {
    const audio = await synthesizeSpeech(body.data.text, params);
    return new NextResponse(audio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "X-Ely-Voice": params.voice,
        "X-Ely-Voice-Speed": String(params.speed),
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "TTS failed" },
      { status: 500 }
    );
  }
}
