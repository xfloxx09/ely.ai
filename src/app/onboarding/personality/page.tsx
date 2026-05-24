import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { PersonalityJourney } from "@/components/onboarding/personality-journey";

export const dynamic = "force-dynamic";
export const metadata = { title: "Awaken your ELY" };

export default async function PersonalityOnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/onboarding/personality");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingStep: true, role: true },
  });

  if (user?.onboardingStep === "COMPLETE" || user?.role === "ADMIN") {
    redirect("/app");
  }

  return <PersonalityJourney />;
}
