import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { PersonalityForm } from "@/components/onboarding/personality-form";

export const metadata = { title: "Personality snapshot" };

export default async function PersonalityOnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingStep: true, role: true },
  });

  if (user?.onboardingStep === "COMPLETE" || user?.role === "ADMIN") {
    redirect("/app");
  }

  return <PersonalityForm />;
}
