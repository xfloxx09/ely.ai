import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PortalButton } from "@/components/settings/portal-button";
import { PersonaSettingsForm } from "@/components/settings/persona-settings-form";
import Link from "next/link";

export const metadata = { title: "Settings" };

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const params = await searchParams;
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      role: true,
      referralCode: true,
      stripeCustomerId: true,
      subscription: true,
      personaSettings: true,
      personalityProfile: { select: { completedAt: true } },
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Settings</h1>

      {params.checkout === "success" ? (
        <p className="rounded-lg bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          Subscription updated successfully. Thank you!
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-300">
          <p>
            <span className="text-slate-500">Name:</span> {user?.name}
          </p>
          <p>
            <span className="text-slate-500">Email:</span> {user?.email}
          </p>
          <p>
            <span className="text-slate-500">Role:</span> {user?.role}
          </p>
          <p>
            <span className="text-slate-500">Referral code:</span>{" "}
            {user?.referralCode}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personality & privacy</CardTitle>
        </CardHeader>
        <CardContent>
          {user?.personalityProfile ? (
            <p className="mb-4 text-sm text-slate-400">
              Snapshot completed{" "}
              {user.personalityProfile.completedAt.toLocaleDateString()}
            </p>
          ) : (
            <p className="mb-4 text-sm text-amber-300">
              <Link href="/onboarding/personality" className="underline">
                Complete your personality snapshot
              </Link>
            </p>
          )}
          <PersonaSettingsForm
            initialOptOut={user?.personaSettings?.optOutPersonalization ?? false}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-300">
            Plan:{" "}
            <span className="font-medium text-violet-300">
              Ely {user?.subscription?.plan ?? "FREE"}
            </span>{" "}
            ({user?.subscription?.status ?? "ACTIVE"})
          </p>
          {user?.stripeCustomerId ? (
            <PortalButton />
          ) : (
            <Link
              href="/pricing"
              className="inline-block text-sm text-violet-400 hover:underline"
            >
              Choose a plan →
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
