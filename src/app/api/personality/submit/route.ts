import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { BFI2_SHORT_ITEMS } from "@/lib/personality/bfi2-short";
import { scoreBfi2Short, buildStyleSummary } from "@/lib/personality/scoring";
import { z } from "zod";

const schema = z.object({
  answers: z.record(z.string(), z.number()),
  consent: z.literal(true),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = schema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
  }

  const answers: Record<number, number> = {};
  for (const item of BFI2_SHORT_ITEMS) {
    const val = body.data.answers[String(item.id)];
    if (val == null || val < 1 || val > 5) {
      return NextResponse.json(
        { error: `Missing answer for question ${item.id}` },
        { status: 400 }
      );
    }
    answers[item.id] = val;
  }

  const scores = scoreBfi2Short(answers);
  const styleSummary = buildStyleSummary(scores);

  await db.$transaction(async (tx) => {
    await tx.personalityProfile.upsert({
      where: { userId: session.user!.id },
      create: {
        userId: session.user!.id,
        ...scores,
        version: "SHORT",
      },
      update: {
        ...scores,
        retakeCount: { increment: 1 },
        completedAt: new Date(),
      },
    });
    await tx.personaSettings.upsert({
      where: { userId: session.user!.id },
      create: {
        userId: session.user!.id,
        communicationStyleSummary: styleSummary,
      },
      update: { communicationStyleSummary: styleSummary },
    });
    await tx.avatarProfile.upsert({
      where: { userId: session.user!.id },
      create: {
        userId: session.user!.id,
        traitSnapshot: scores,
        evolutionStage: 0,
      },
      update: { traitSnapshot: scores },
    });
    await tx.user.update({
      where: { id: session.user!.id },
      data: {
        onboardingStep: "COMPLETE",
        personalityCompletedAt: new Date(),
      },
    });
    await tx.userQuestProgress.upsert({
      where: {
        userId_questId: {
          userId: session.user!.id,
          questId: "quest_personality",
        },
      },
      create: {
        userId: session.user!.id,
        questId: "quest_personality",
        status: "COMPLETED",
        completedAt: new Date(),
      },
      update: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });
  });

  await db.user.update({
    where: { id: session.user.id },
    data: { xp: { increment: 25 } },
  });

  const enrolled = await db.user.findUnique({
    where: { id: session.user.id },
    select: { sponsorId: true, role: true },
  });
  if (
    enrolled?.sponsorId &&
    enrolled.role === "RETAIL"
  ) {
    await db.user.update({
      where: { id: enrolled.sponsorId },
      data: { soulSeekerProgress: { increment: 1 } },
    });
  }

  return NextResponse.json({ ok: true, scores });
}
