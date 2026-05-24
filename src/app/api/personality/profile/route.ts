import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [profile, settings] = await Promise.all([
    db.personalityProfile.findUnique({
      where: { userId: session.user.id },
    }),
    db.personaSettings.findUnique({
      where: { userId: session.user.id },
    }),
  ]);

  if (!profile) {
    return NextResponse.json({ completed: false });
  }

  return NextResponse.json({
    completed: true,
    scores: {
      openness: profile.openness,
      conscientiousness: profile.conscientiousness,
      extraversion: profile.extraversion,
      agreeableness: profile.agreeableness,
      neuroticism: profile.neuroticism,
    },
    optOut: settings?.optOutPersonalization ?? false,
    completedAt: profile.completedAt,
  });
}
