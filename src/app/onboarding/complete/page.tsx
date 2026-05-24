import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { traitLabels } from "@/lib/personality/scoring";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Meet your ELY" };

export default async function OnboardingCompletePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profile = await db.personalityProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!profile) redirect("/onboarding/personality");

  const scores = {
    openness: profile.openness,
    conscientiousness: profile.conscientiousness,
    extraversion: profile.extraversion,
    agreeableness: profile.agreeableness,
    neuroticism: profile.neuroticism,
  };

  const traits = traitLabels(scores);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Meet your ELY</h1>
        <p className="mt-2 text-slate-400">
          ELY will mirror your communication style and grow with you over time.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your personality snapshot</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {traits.map((t) => (
            <div key={t.name}>
              <div className="flex justify-between text-sm">
                <span className="text-white">{t.name}</span>
                <span className="text-violet-300">{t.value}/100</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-white/10">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500"
                  style={{ width: `${t.value}%` }}
                />
              </div>
              <p className="mt-0.5 text-xs text-slate-500">{t.desc}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <p className="text-sm text-slate-500">
        On Ely Plus, ELY adapts its tone to these traits. On Pro, you unlock the
        full visual companion and deep memory (Phase 2: Ready Player Me avatar).
      </p>

      <Link href="/app">
        <Button size="lg" className="w-full">
          Start chatting with ELY
        </Button>
      </Link>
    </div>
  );
}
