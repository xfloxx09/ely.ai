import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      name: true,
      createdAt: true,
      personalityProfile: true,
      personaSettings: {
        select: {
          optOutPersonalization: true,
          communicationStyleSummary: true,
        },
      },
      subscription: { select: { plan: true, status: true } },
    },
  });

  return NextResponse.json({
    exportDate: new Date().toISOString(),
    account: {
      email: user?.email,
      name: user?.name,
      memberSince: user?.createdAt,
      plan: user?.subscription?.plan,
    },
    personality: user?.personalityProfile
      ? {
          openness: user.personalityProfile.openness,
          conscientiousness: user.personalityProfile.conscientiousness,
          extraversion: user.personalityProfile.extraversion,
          agreeableness: user.personalityProfile.agreeableness,
          neuroticism: user.personalityProfile.neuroticism,
          completedAt: user.personalityProfile.completedAt,
        }
      : null,
    settings: user?.personaSettings,
    note: "Raw BFI-2 answers are never stored. Contact support to delete your account data.",
  });
}
