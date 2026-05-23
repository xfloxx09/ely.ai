import { db } from "@/lib/db";
import { planMonthlyValueCents } from "@/lib/utils";

export async function calculateGroupVolume(userId: string): Promise<number> {
  const descendants = await db.genealogyClosure.findMany({
    where: { ancestorId: userId, depth: { gt: 0 } },
    select: { descendantId: true },
  });

  if (descendants.length === 0) return 0;

  const users = await db.user.findMany({
    where: { id: { in: descendants.map((d) => d.descendantId) } },
    select: {
      subscription: { select: { plan: true, status: true } },
    },
  });

  let gvCents = 0;
  for (const u of users) {
    if (u.subscription?.status !== "ACTIVE") continue;
    if (u.subscription.plan === "PRO") gvCents += planMonthlyValueCents("PRO");
    else if (u.subscription.plan === "PLUS")
      gvCents += planMonthlyValueCents("PLUS");
  }

  return gvCents;
}

export async function calculatePersonalVolume(userId: string): Promise<number> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      subscription: { select: { plan: true, status: true } },
      referrals: {
        select: {
          role: true,
          subscription: { select: { plan: true, status: true } },
        },
      },
    },
  });

  if (!user) return 0;

  let pvCents = 0;
  if (
    user.subscription?.status === "ACTIVE" &&
    user.subscription.plan === "PRO"
  ) {
    pvCents += planMonthlyValueCents("PRO");
  }

  for (const ref of user.referrals) {
    if (ref.role === "AFFILIATE") continue;
    if (ref.subscription?.status !== "ACTIVE") continue;
    if (ref.subscription.plan === "PRO") pvCents += planMonthlyValueCents("PRO");
    else if (ref.subscription.plan === "PLUS")
      pvCents += planMonthlyValueCents("PLUS");
  }

  return pvCents;
}
