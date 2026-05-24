import { db } from "@/lib/db";

/** Avatar evolution stages (0–3) based on engagement and Pro RPM. */
export async function computeEvolutionStage(userId: string): Promise<number> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      xp: true,
      streak: true,
      subscription: { select: { plan: true } },
      avatarProfile: { select: { rpmAvatarId: true, evolutionStage: true } },
      _count: { select: { chatMessages: true } },
    },
  });

  if (!user) return 0;

  let stage = 0;
  if (user._count.chatMessages >= 25 || user.xp >= 100) stage = 1;
  if (user.streak >= 7 || user._count.chatMessages >= 100) stage = 2;
  if (
    user.subscription?.plan === "PRO" &&
    user.avatarProfile?.rpmAvatarId
  ) {
    stage = 3;
  }

  return Math.max(stage, user.avatarProfile?.evolutionStage ?? 0);
}

export async function syncEvolutionStage(userId: string) {
  const stage = await computeEvolutionStage(userId);
  await db.avatarProfile.upsert({
    where: { userId },
    create: { userId, evolutionStage: stage },
    update: { evolutionStage: stage },
  });
  return stage;
}

export function evolutionLabel(stage: number): string {
  const labels = ["Sketch", "Forming", "Alive", "Radiant"];
  return labels[Math.min(stage, 3)] ?? "Sketch";
}
