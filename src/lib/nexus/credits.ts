import { db } from "@/lib/db";

const CREDITS_PER_NEXUS_REQUEST = 1;

export async function getCreditBalance(userId: string): Promise<number> {
  const row = await db.elyCredits.findUnique({ where: { userId } });
  return row?.balance ?? 0;
}

export async function deductNexusCredit(
  userId: string,
  description: string
): Promise<{ ok: boolean; balance: number }> {
  const row = await db.elyCredits.findUnique({ where: { userId } });
  if (!row || row.balance < CREDITS_PER_NEXUS_REQUEST) {
    return { ok: false, balance: row?.balance ?? 0 };
  }

  const updated = await db.$transaction(async (tx) => {
    const credits = await tx.elyCredits.update({
      where: { userId },
      data: { balance: { decrement: CREDITS_PER_NEXUS_REQUEST } },
    });
    await tx.creditTransaction.create({
      data: {
        userId,
        type: "USAGE",
        amountCents: 0,
        credits: CREDITS_PER_NEXUS_REQUEST,
        description,
      },
    });
    return credits;
  });

  return { ok: true, balance: updated.balance };
}
