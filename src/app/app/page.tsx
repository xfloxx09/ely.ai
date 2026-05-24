import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ChatInterface } from "@/components/app/chat-interface";
import { todayKey } from "@/lib/utils";
import { effectivePlanForUser } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { needsPersonalityOnboarding } from "@/lib/onboarding";

export const metadata = { title: "ELY" };

export default async function AppPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userRecord = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      onboardingStep: true,
      subscription: { select: { plan: true } },
      personalityProfile: true,
      personaSettings: true,
      avatarProfile: { select: { rpmUrl: true } },
    },
  });

  if (
    userRecord &&
    needsPersonalityOnboarding(userRecord.onboardingStep, userRecord.role)
  ) {
    redirect("/onboarding/personality");
  }

  const plan = effectivePlanForUser(
    userRecord?.subscription?.plan ?? "FREE",
    userRecord?.role
  );

  const usage = await db.aiUsage.findUnique({
    where: {
      userId_date: { userId: session.user.id, date: todayKey() },
    },
  });
  const remaining =
    plan === "FREE" ? Math.max(0, 20 - (usage?.messageCount ?? 0)) : null;

  const scores = userRecord?.personalityProfile
    ? {
        openness: userRecord.personalityProfile.openness,
        conscientiousness: userRecord.personalityProfile.conscientiousness,
        extraversion: userRecord.personalityProfile.extraversion,
        agreeableness: userRecord.personalityProfile.agreeableness,
        neuroticism: userRecord.personalityProfile.neuroticism,
      }
    : null;

  const knowsYou =
    Boolean(scores) &&
    !userRecord?.personaSettings?.optOutPersonalization &&
    (plan === "PLUS" || plan === "PRO");

  return (
    <ChatInterface
      initialPlan={plan}
      initialRemaining={remaining}
      knowsYou={knowsYou}
      scores={scores}
      rpmUrl={userRecord?.avatarProfile?.rpmUrl}
    />
  );
}
