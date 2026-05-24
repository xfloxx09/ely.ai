import type { BigFiveScores } from "@/lib/personality/scoring";
import { traitToAvatarColors } from "@/lib/avatar/rpm";

export function ElyAvatar({
  scores,
  plan,
  rpmUrl,
}: {
  scores?: BigFiveScores | null;
  plan: string;
  rpmUrl?: string | null;
}) {
  if (rpmUrl && plan === "PRO") {
    return (
      <img
        src={rpmUrl}
        alt="Your ELY avatar"
        className="h-14 w-14 rounded-2xl object-cover ring-2 ring-violet-500/40"
      />
    );
  }

  const colors = scores
    ? traitToAvatarColors(scores)
    : { primary: "hsl(270, 70%, 55%)", accent: "hsl(320, 65%, 55%)", glow: 0.2 };

  return (
    <div
      className="relative flex h-14 w-14 items-center justify-center rounded-2xl"
      style={{
        background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
        boxShadow: `0 0 24px rgba(139, 92, 246, ${colors.glow})`,
      }}
      title={plan === "PRO" ? "ELY face unlocks with Ready Player Me (Phase 2)" : "Complete personality + Plus to personalize"}
    >
      <span className="text-2xl font-bold text-white/90">E</span>
      {plan !== "PRO" ? (
        <span className="absolute -bottom-1 -right-1 rounded-full bg-slate-900 px-1 text-[9px] text-violet-300 ring-1 ring-violet-500/50">
          {plan === "FREE" ? "Default" : "Tone"}
        </span>
      ) : null}
    </div>
  );
}
