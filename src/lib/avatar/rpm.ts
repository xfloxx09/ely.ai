import type { BigFiveScores } from "@/lib/personality/scoring";
import { db } from "@/lib/db";
import { syncEvolutionStage } from "./evolution";

export function isRpmConfigured(): boolean {
  return Boolean(process.env.RPM_SUBDOMAIN || process.env.NEXT_PUBLIC_RPM_SUBDOMAIN);
}

export function getRpmSubdomain(): string {
  return (
    process.env.NEXT_PUBLIC_RPM_SUBDOMAIN ??
    process.env.RPM_SUBDOMAIN ??
    "demo"
  );
}

export function getRpmCreatorUrl(userId: string): string {
  const subdomain = getRpmSubdomain();
  const appId = process.env.NEXT_PUBLIC_RPM_APP_ID ?? process.env.RPM_APP_ID;
  const params = new URLSearchParams({
    frameApi: "",
    clearCache: "true",
    userId,
  });
  if (appId) params.set("appId", appId);
  return `https://${subdomain}.readyplayer.me/avatar?${params.toString()}`;
}

export function rpmPortraitUrl(avatarId: string, size = 256): string {
  return `https://models.readyplayer.me/${avatarId}.png?size=${size}`;
}

/** Map Big Five to RPM creator query hints (expressiveness, warmth). */
export function traitToRpmPresets(scores: BigFiveScores) {
  return {
    bodyType: scores.extraversion > 60 ? "fullbody" : "halfbody",
    language: "en",
    quickStart: false,
    mood: scores.agreeableness > 55 ? "happy" : "neutral",
    expressiveness: Math.round(scores.extraversion / 25),
    warmth: Math.round(scores.agreeableness / 25),
  };
}

export function traitToAvatarColors(scores: BigFiveScores) {
  return {
    primary: `hsl(${scores.openness * 3.6}, 70%, 55%)`,
    accent: `hsl(${scores.agreeableness * 3.6}, 65%, 60%)`,
    glow: scores.extraversion > 60 ? 0.4 : 0.15,
  };
}

export async function saveRpmAvatar(
  userId: string,
  rpmAvatarId: string
): Promise<{ url: string; evolutionStage: number }> {
  const url = rpmPortraitUrl(rpmAvatarId);
  const profile = await db.personalityProfile.findUnique({
    where: { userId },
  });
  const traitSnapshot = profile
    ? {
        openness: profile.openness,
        conscientiousness: profile.conscientiousness,
        extraversion: profile.extraversion,
        agreeableness: profile.agreeableness,
        neuroticism: profile.neuroticism,
      }
    : undefined;

  await db.avatarProfile.upsert({
    where: { userId },
    create: {
      userId,
      rpmAvatarId,
      rpmUrl: url,
      traitSnapshot,
    },
    update: { rpmAvatarId, rpmUrl: url, traitSnapshot },
  });

  const evolutionStage = await syncEvolutionStage(userId);
  return { url, evolutionStage };
}

export async function getAvatarForUser(userId: string) {
  return db.avatarProfile.findUnique({
    where: { userId },
    select: {
      rpmAvatarId: true,
      rpmUrl: true,
      companionName: true,
      evolutionStage: true,
    },
  });
}
