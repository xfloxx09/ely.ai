import {
  CommissionType,
  Plan,
  SubscriptionStatus,
  UserRole,
} from "@prisma/client";
import { db } from "@/lib/db";
import { currentPeriod, planMonthlyValueCents } from "@/lib/utils";

const FAST_START_RATE = 0.3;
const RESIDUAL_RATE = 0.2;
const UNILEVEL_L1_RATE = 0.05;
const MIN_PV_CENTS = 5000;

export async function isAffiliateActive(userId: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      subscription: { select: { plan: true, status: true } },
      referrals: {
        select: {
          role: true,
          subscription: { select: { plan: true, status: true } },
        },
      },
    },
  });

  if (!user || (user.role !== "AFFILIATE" && user.role !== "ADMIN")) return false;
  if (
    user.subscription?.status !== "ACTIVE" ||
    user.subscription.plan !== "PRO"
  ) {
    return false;
  }

  let pvCents = planMonthlyValueCents("PRO");
  for (const ref of user.referrals) {
    if (ref.role === "AFFILIATE") continue;
    if (ref.subscription?.status !== "ACTIVE") continue;
    if (ref.subscription.plan === "PRO") pvCents += planMonthlyValueCents("PRO");
    else if (ref.subscription.plan === "PLUS")
      pvCents += planMonthlyValueCents("PLUS");
  }

  return pvCents >= MIN_PV_CENTS;
}

export async function recordFastStartCommission(
  buyerUserId: string,
  plan: Plan
) {
  if (plan === "FREE") return;

  const buyer = await db.user.findUnique({
    where: { id: buyerUserId },
    select: { sponsorId: true, firstInvoicePaid: true },
  });

  if (!buyer?.sponsorId || buyer.firstInvoicePaid) return;

  const sponsor = await db.user.findUnique({
    where: { id: buyer.sponsorId },
    select: { role: true },
  });

  if (!sponsor || sponsor.role !== "AFFILIATE") return;
  if (!(await isAffiliateActive(buyer.sponsorId))) return;

  const amountCents = Math.round(
    planMonthlyValueCents(plan === "PRO" ? "PRO" : "PLUS") * FAST_START_RATE
  );

  const period = currentPeriod();

  const existing = await db.commissionLedger.findFirst({
    where: {
      userId: buyer.sponsorId,
      sourceUserId: buyerUserId,
      type: CommissionType.FAST_START,
    },
  });

  if (existing) return;

  await db.commissionLedger.create({
    data: {
      userId: buyer.sponsorId,
      sourceUserId: buyerUserId,
      type: CommissionType.FAST_START,
      amountCents,
      period,
      description: `Fast-start bonus for ${plan} enrollment`,
    },
  });

  await db.user.update({
    where: { id: buyerUserId },
    data: { firstInvoicePaid: true },
  });
}

export async function runMonthlyCommissions() {
  const period = currentPeriod();
  const activeSubs = await db.subscription.findMany({
    where: { status: SubscriptionStatus.ACTIVE, plan: { in: ["PLUS", "PRO"] } },
    include: {
      user: { select: { id: true, sponsorId: true, role: true } },
    },
  });

  let created = 0;

  for (const sub of activeSubs) {
    const monthlyCents = planMonthlyValueCents(
      sub.plan === "PRO" ? "PRO" : "PLUS"
    );
    const buyer = sub.user;

    if (buyer.sponsorId) {
      const sponsor = await db.user.findUnique({
        where: { id: buyer.sponsorId },
        select: { role: true },
      });

      if (
        sponsor?.role === "AFFILIATE" &&
        (await isAffiliateActive(buyer.sponsorId))
      ) {
        const residualCents = Math.round(monthlyCents * RESIDUAL_RATE);
        const exists = await db.commissionLedger.findFirst({
          where: {
            userId: buyer.sponsorId,
            sourceUserId: buyer.id,
            type: CommissionType.RESIDUAL,
            period,
          },
        });

        if (!exists) {
          await db.commissionLedger.create({
            data: {
              userId: buyer.sponsorId,
              sourceUserId: buyer.id,
              type: CommissionType.RESIDUAL,
              amountCents: residualCents,
              period,
              description: `Personal residual (${sub.plan})`,
            },
          });
          created++;
        }
      }
    }

    if (buyer.sponsorId) {
      const sponsorAffiliate = await db.user.findUnique({
        where: { id: buyer.sponsorId },
        select: { role: true },
      });

      if (
        sponsorAffiliate?.role === "AFFILIATE" &&
        (await isAffiliateActive(buyer.sponsorId))
      ) {
        const unilevelCents = Math.round(monthlyCents * UNILEVEL_L1_RATE);
        const exists = await db.commissionLedger.findFirst({
          where: {
            userId: buyer.sponsorId,
            sourceUserId: buyer.id,
            type: CommissionType.UNILEVEL_L1,
            period,
          },
        });

        if (!exists) {
          await db.commissionLedger.create({
            data: {
              userId: buyer.sponsorId,
              sourceUserId: buyer.id,
              type: CommissionType.UNILEVEL_L1,
              amountCents: unilevelCents,
              period,
              description: `Unilevel L1 (${sub.plan})`,
            },
          });
          created++;
        }
      }
    }
  }

  return { period, created };
}

export async function getCommissionSummary(userId: string) {
  const entries = await db.commissionLedger.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      source: { select: { name: true, email: true } },
    },
  });

  const totalCents = entries.reduce((sum, e) => sum + e.amountCents, 0);
  const pendingCents = entries
    .filter((e) => e.status === "PENDING")
    .reduce((sum, e) => sum + e.amountCents, 0);

  return { entries, totalCents, pendingCents };
}
