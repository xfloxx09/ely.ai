import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ChatInterface } from "@/components/app/chat-interface";
import { todayKey } from "@/lib/utils";
import { effectivePlanForUser } from "@/lib/auth-utils";
import { redirect } from "next/navigation";

export const metadata = { title: "Assistant" };

export default async function AppPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userRecord = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, subscription: { select: { plan: true } } },
  });
  const plan = effectivePlanForUser(
    userRecord?.subscription?.plan ?? "FREE",
    userRecord?.role
  );

  const usage = await db.aiUsage.findUnique({
    where: {
      userId_date: { userId: session.user.id, date: todayKey() },
    },
  });
  const remaining =
    plan === "FREE" ? Math.max(0, 10 - (usage?.messageCount ?? 0)) : null;

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { xp: true, streak: true, dailyTaskCount: true },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Ely Assistant</h1>
        <p className="mt-1 text-sm text-slate-400">
          Daily quests: {user?.dailyTaskCount ?? 0}/3 · XP {user?.xp ?? 0} ·
          Streak {user?.streak ?? 0} days
        </p>
      </div>
      <ChatInterface initialPlan={plan} initialRemaining={remaining} />
    </div>
  );
}
