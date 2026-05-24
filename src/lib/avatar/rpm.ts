import type { BigFiveScores } from "@/lib/personality/scoring";

export function isRpmConfigured(): boolean {
  return Boolean(process.env.RPM_APP_ID && process.env.RPM_SUBDOMAIN);
}

export function getRpmCreatorUrl(userId: string): string | null {
  const subdomain = process.env.RPM_SUBDOMAIN;
  if (!subdomain) return null;
  return `https://${subdomain}.readyplayer.me/avatar?frameApi&userId=${encodeURIComponent(userId)}`;
}

export function traitToAvatarColors(scores: BigFiveScores) {
  return {
    primary: `hsl(${scores.openness * 3.6}, 70%, 55%)`,
    accent: `hsl(${scores.agreeableness * 3.6}, 65%, 60%)`,
    glow: scores.extraversion > 60 ? 0.4 : 0.15,
  };
}

export async function syncRpmAvatar(
  _userId: string,
  _rpmAvatarId: string
): Promise<{ url: string | null; message: string }> {
  if (!isRpmConfigured()) {
    return {
      url: null,
      message: "Ready Player Me integration available on Ely Pro (Phase 2).",
    };
  }
  return { url: null, message: "RPM sync stub — configure in Phase 2." };
}
