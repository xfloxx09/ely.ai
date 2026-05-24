import { CommissionType, SubscriptionStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { currentPeriod, planMonthlyValueCents } from "@/lib/utils";
import { isAffiliateActive } from "./commissions";

const UNILEVEL_RATES: Record<number, number> = {
  1: 0.05,
  2: 0.03,
  3: 0.02,
};

const DEPTH_TO_TYPE: Record<number, CommissionType> = {
  1: CommissionType.UNILEVEL_L1,
  2: CommissionType.UNILEVEL_L2,
  3: CommissionType.UNILEVEL_L3,
};

const LEADERSHIP_MATCH_RATE = 0.1;
const LEADERSHIP_RANKS = new Set(["VISIONARY", "MASTERMIND", "ELITE_MASTERMIND"]);

export async function runDepthUnilevel(period: string): Promise<number> {
  const activeSubs = await db.subscription.findMany({
    where: { status: SubscriptionStatus.ACTIVE, plan: { in: ["PLUS", "PRO"] } },
    select: { userId: true, plan: true },
  });

  let created = 0;

  for (const sub of activeSubs) {
    const monthlyCents = planMonthlyValueCents(
      sub.plan === "PRO" ? "PRO" : "PLUS"
    );

    for (let depth = 1; depth <= 3; depth++) {
      const ancestors = await db.genealogyClosure.findMany({
        where: { descendantId: sub.userId, depth },
        select: { ancestorId: true },
      });

      for (const { ancestorId } of ancestors) {
        const affiliate = await db.user.findUnique({
          where: { id: ancestorId },
          select: { role: true },
        });
        if (affiliate?.role !== "AFFILIATE") continue;
        if (!(await isAffiliateActive(ancestorId))) continue;

        const rate = UNILEVEL_RATES[depth];
        const amountCents = Math.round(monthlyCents * rate);
        const type = DEPTH_TO_TYPE[depth];

        const exists = await db.commissionLedger.findFirst({
          where: {
            userId: ancestorId,
            sourceUserId: sub.userId,
            type,
            period,
          },
        });
        if (exists) continue;

        await db.commissionLedger.create({
          data: {
            userId: ancestorId,
            sourceUserId: sub.userId,
            type,
            amountCents,
            period,
            description: `Unilevel L${depth} (${sub.plan})`,
          },
        });
        created++;
      }
    }
  }

  return created;
}

export async function runLeadershipMatch(period: string): Promise<number> {
  const downlineCommissions = await db.commissionLedger.findMany({
    where: {
      period,
      type: {
        in: [
          CommissionType.UNILEVEL_L1,
          CommissionType.UNILEVEL_L2,
          CommissionType.UNILEVEL_L3,
          CommissionType.RESIDUAL,
        ],
      },
    },
    select: { userId: true, amountCents: true },
  });

  let created = 0;

  for (const entry of downlineCommissions) {
    const upline = await db.user.findUnique({
      where: { id: entry.userId },
      select: { sponsorId: true },
    });
    if (!upline?.sponsorId) continue;

    const leader = await db.user.findUnique({
      where: { id: upline.sponsorId },
      select: { role: true, rank: true },
    });

    if (leader?.role !== "AFFILIATE") continue;
    if (!LEADERSHIP_RANKS.has(leader.rank)) continue;
    if (!(await isAffiliateActive(upline.sponsorId))) continue;

    const amountCents = Math.round(entry.amountCents * LEADERSHIP_MATCH_RATE);
    if (amountCents < 1) continue;

    const exists = await db.commissionLedger.findFirst({
      where: {
        userId: upline.sponsorId,
        sourceUserId: entry.userId,
        type: CommissionType.LEADERSHIP_MATCH,
        period,
      },
    });
    if (exists) continue;

    await db.commissionLedger.create({
      data: {
        userId: upline.sponsorId,
        sourceUserId: entry.userId,
        type: CommissionType.LEADERSHIP_MATCH,
        amountCents,
        period,
        description: `Leadership match (${leader.rank})`,
      },
    });
    created++;
  }

  return created;
}

export async function runPhase2Commissions() {
  const period = currentPeriod();
  const depth = await runDepthUnilevel(period);
  const leadership = await runLeadershipMatch(period);
  return { period, depth, leadership };
}
