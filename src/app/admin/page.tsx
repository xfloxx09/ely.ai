import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { isAdminRole } from "@/lib/auth-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const me = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, email: true },
  });

  if (!isAdminRole(me?.role)) redirect("/");

  const [users, subs, commissions, messages] = await Promise.all([
    db.user.count(),
    db.subscription.groupBy({
      by: ["plan"],
      _count: true,
    }),
    db.commissionLedger.aggregate({
      _sum: { amountCents: true },
      _count: true,
    }),
    db.chatMessage.count(),
  ]);

  const recentUsers = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      referralCode: true,
      createdAt: true,
      subscription: { select: { plan: true, status: true } },
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-violet-400">Admin console</p>
        <h1 className="text-3xl font-bold text-white">Ely platform overview</h1>
        <p className="mt-2 text-slate-400">Signed in as {me?.email}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{users}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Commissions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">
              {commissions._count}
            </p>
            <p className="text-xs text-slate-500">
              {formatCurrency(commissions._sum.amountCents ?? 0)} total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI messages</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{messages}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plans</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-slate-300">
            {subs.map((s) => (
              <p key={s.plan}>
                {s.plan}: {s._count}
              </p>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard"
          className="rounded-xl bg-violet-600 px-4 py-2 text-sm text-white hover:bg-violet-500"
        >
          Affiliate dashboard
        </Link>
        <Link
          href="/app"
          className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white hover:bg-white/5"
        >
          AI assistant
        </Link>
        <Link
          href="/pricing"
          className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white hover:bg-white/5"
        >
          Pricing page
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent users</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="pb-2">Email</th>
                <th className="pb-2">Role</th>
                <th className="pb-2">Plan</th>
                <th className="pb-2">Referral</th>
                <th className="pb-2">Joined</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {recentUsers.map((u) => (
                <tr key={u.id} className="border-t border-white/5">
                  <td className="py-2">{u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.subscription?.plan ?? "—"}</td>
                  <td className="font-mono text-xs">{u.referralCode}</td>
                  <td>{u.createdAt.toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
