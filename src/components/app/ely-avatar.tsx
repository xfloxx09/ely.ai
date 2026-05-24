import type { BigFiveScores } from "@/lib/personality/scoring";
import { traitToAvatarColors } from "@/lib/avatar/rpm";
import { evolutionLabel } from "@/lib/avatar/evolution";

export function ElyAvatar({
  scores,
  plan,
  rpmUrl,
  companionName,
  evolutionStage = 0,
}: {
  scores?: BigFiveScores | null;
  plan: string;
  rpmUrl?: string | null;
  companionName?: string | null;
  evolutionStage?: number;
}) {
  if (rpmUrl && (plan === "PRO" || plan === "PLUS")) {
    return (
      <div className="relative">
        <img
          src={rpmUrl}
          alt={companionName ?? "Your ELY avatar"}
          className="h-14 w-14 rounded-2xl object-cover ring-2 ring-violet-500/40"
        />
        <span className="absolute -bottom-1 -right-1 rounded-full bg-slate-900 px-1.5 text-[9px] text-violet-300 ring-1 ring-violet-500/50">
          {evolutionLabel(evolutionStage)}
        </span>
      </div>
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
      title={
        plan === "PRO"
          ? "Create your face in Settings → ELY face"
          : "Complete personality + Plus to personalize"
      }
    >
      <span className="text-2xl font-bold text-white/90">
        {(companionName ?? "E").charAt(0).toUpperCase()}
      </span>
      <span className="absolute -bottom-1 -right-1 rounded-full bg-slate-900 px-1 text-[9px] text-violet-300 ring-1 ring-violet-500/50">
        {plan === "FREE" ? "Default" : evolutionLabel(evolutionStage)}
      </span>
    </div>
  );
}
