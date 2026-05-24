import { OnboardingStep, UserRole } from "@prisma/client";

export function needsPersonalityOnboarding(
  step: OnboardingStep,
  role: UserRole
): boolean {
  if (role === "ADMIN") return false;
  return step !== "COMPLETE";
}
