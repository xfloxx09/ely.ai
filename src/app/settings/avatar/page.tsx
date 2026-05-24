import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { effectivePlanForUser } from "@/lib/auth-utils";
import {
  getRpmCreatorUrl,
  isRpmConfigured,
  traitToRpmPresets,
} from "@/lib/avatar/rpm";
import { evolutionLabel } from "@/lib/avatar/evolution";
import { RpmCreator } from "@/components/settings/rpm-creator";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "ELY Avatar" };

export default async function AvatarSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      subscription: true,
      personalityProfile: true,
      avatarProfile: true,
    },
  });

  const plan = effectivePlanForUser(
    user?.subscription?.plan ?? "FREE",
    user?.role
  );

  if (plan !== "PRO" && user?.role !== "ADMIN") {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-white">ELY Face</h1>
        <p className="text-slate-400">
          Ready Player Me avatars unlock on{" "}
          <Link href="/pricing" className="text-violet-400 underline">
            Ely Pro
          </Link>
          .
        </p>
      </div>
    );
  }

  const creatorUrl = getRpmCreatorUrl(session.user.id);
  const presets = user?.personalityProfile
    ? traitToRpmPresets({
        openness: user.personalityProfile.openness,
        conscientiousness: user.personalityProfile.conscientiousness,
        extraversion: user.personalityProfile.extraversion,
        agreeableness: user.personalityProfile.agreeableness,
        neuroticism: user.personalityProfile.neuroticism,
      })
    : null;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/settings" className="text-sm text-violet-400 hover:underline">
          ← Settings
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-white">Your ELY face</h1>
        <p className="text-sm text-slate-400">
          Stage: {evolutionLabel(user?.avatarProfile?.evolutionStage ?? 0)}
          {user?.avatarProfile?.companionName
            ? ` · ${user.avatarProfile.companionName}`
            : ""}
        </p>
        {presets ? (
          <p className="mt-1 text-xs text-slate-500">
            Personality presets: expressiveness {presets.expressiveness}, warmth{" "}
            {presets.warmth}
          </p>
        ) : null}
      </div>

      {!isRpmConfigured() ? (
        <p className="rounded-lg bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Set <code>NEXT_PUBLIC_RPM_SUBDOMAIN</code> (e.g. demo) on Railway to
          enable the creator. Using demo subdomain by default.
        </p>
      ) : null}

      <RpmCreator
        creatorUrl={creatorUrl}
        initialAvatarId={user?.avatarProfile?.rpmAvatarId}
      />
    </div>
  );
}
