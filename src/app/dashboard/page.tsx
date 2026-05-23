import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { calculateGroupVolume, calculatePersonalVolume } from "@/lib/mlm/gv";
import {
  countPersonalSponsors,
  getDirectDownline,
} from "@/lib/mlm/genealogy";
import { getCommissionSummary, isAffiliateActive } from "@/lib/mlm/commissions";
import { hasAffiliateAccess, isAdminRole } from "@/lib/auth-utils";
import { CopyButton } from "@/components/dashboard/copy-button";

export const metadata = { title: "Affiliate Dashboard" };

const RANKS = [
  { name: "Explorer", levels: 1, active: true },
  { name: "Builder", levels: 3, active: false },
  { name: "Innovator", levels: 5, active: false },
  { name: "Visionary", levels: 7, active: false },
  { name: "Mastermind", levels: 9, active: false },
];

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      referralCode: true,
      role: true,
      rank: true,
      subscription: { select: { plan: true, status: true } },
    },
  });

  const isAdmin = isAdminRole(user?.role);
  const isPro =
    isAdmin ||
    (user?.subscription?.status === "ACTIVE" &&
      user.subscription.plan === "PRO");

  if (!user || !isPro || !hasAffiliateAccess(user.role)) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <h1 className="text-2xl font-bold text-white">Affiliate Dashboard</h1>
        <p className="mt-4 text-slate-400">
          An active <strong className="text-violet-300">Ely Pro</strong> subscription
          is required to access the affiliate portal and earn commissions.
        </p>
        <Link
          href="/pricing"
          className="mt-6 inline-block rounded-xl bg-violet-600 px-6 py-3 text-sm font-medium text-white hover:bg-violet-500"
        >
          Upgrade to Pro
        </Link>
      </div>
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://ely.ai";
  const referralLink = `${appUrl}/register?ref=${user.referralCode}`;

  const [gvCents, pvCents, sponsors, downline, commissions, active] =
    await Promise.all([
      calculateGroupVolume(session.user.id),
      calculatePersonalVolume(session.user.id),
      countPersonalSponsors(session.user.id),
      getDirectDownline(session.user.id),
      getCommissionSummary(session.user.id),
      isAffiliateActive(session.user.id),
    ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Builder&apos;s Arena</h1>
        <p className="mt-2 text-slate-400">
          Rank: <span className="text-violet-300">{user.rank}</span> · Status:{" "}
          {active ? (
            <span className="text-emerald-400">Active</span>
          ) : (
            <span className="text-amber-400">Inactive (need $50+ PV)</span>
          )}
        </p>
      </div>

      <Card className="border-violet-500/30">
        <CardHeader>
          <CardTitle>Your referral link</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <code className="flex-1 break-all rounded-lg bg-black/30 px-3 py-2 text-sm text-violet-200">
            {referralLink}
          </code>
          <CopyButton text={referralLink} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Group Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(gvCents)}
            </p>
            <p className="text-xs text-slate-500">monthly downline value</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Personal Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(pvCents)}
            </p>
            <p className="text-xs text-slate-500">min $50 to stay active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Personal sponsors</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{sponsors}</p>
            <p className="text-xs text-slate-500">active Plus/Pro enrollments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Commissions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(commissions.pendingCents)}
            </p>
            <p className="text-xs text-slate-500">pending this period</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-white">Rank progression</h2>
        <div className="flex flex-wrap gap-2">
          {RANKS.map((r) => (
            <span
              key={r.name}
              className={
                r.active
                  ? "rounded-full bg-violet-600 px-3 py-1 text-sm text-white"
                  : "rounded-full border border-white/10 px-3 py-1 text-sm text-slate-500"
              }
            >
              {r.name}
              {!r.active ? " 🔒" : ""}
            </span>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Direct downline</CardTitle>
        </CardHeader>
        <CardContent>
          {downline.length === 0 ? (
            <p className="text-sm text-slate-500">
              No personal enrollments yet. Share your referral link to get started.
            </p>
          ) : (
            <ul className="divide-y divide-white/5">
              {downline.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between py-3 text-sm"
                >
                  <span className="text-white">
                    {m.name ?? m.email}
                    <span className="ml-2 text-slate-500">{m.role}</span>
                  </span>
                  <span className="text-violet-300">
                    {m.subscription?.plan ?? "FREE"}{" "}
                    {m.subscription?.status === "ACTIVE" ? "✓" : "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent commissions</CardTitle>
        </CardHeader>
        <CardContent>
          {commissions.entries.length === 0 ? (
            <p className="text-sm text-slate-500">No commissions recorded yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {commissions.entries.map((e) => (
                <li
                  key={e.id}
                  className="flex justify-between border-b border-white/5 py-2"
                >
                  <span className="text-slate-300">
                    {e.type} — {e.source.name ?? e.source.email}
                  </span>
                  <span className="font-medium text-white">
                    {formatCurrency(e.amountCents)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
