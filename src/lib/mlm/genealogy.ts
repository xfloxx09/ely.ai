import { db } from "@/lib/db";

export async function attachUserToGenealogy(
  userId: string,
  sponsorId: string | null
) {
  await db.genealogyClosure.create({
    data: { ancestorId: userId, descendantId: userId, depth: 0 },
  });

  if (!sponsorId) return;

  const sponsorAncestors = await db.genealogyClosure.findMany({
    where: { descendantId: sponsorId },
    select: { ancestorId: true, depth: true },
  });

  if (sponsorAncestors.length === 0) return;

  await db.genealogyClosure.createMany({
    data: sponsorAncestors.map((row) => ({
      ancestorId: row.ancestorId,
      descendantId: userId,
      depth: row.depth + 1,
    })),
    skipDuplicates: true,
  });
}

export async function getDirectDownline(userId: string) {
  return db.user.findMany({
    where: { sponsorId: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      subscription: { select: { plan: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getDownlineAtDepth(userId: string, depth: number) {
  const closures = await db.genealogyClosure.findMany({
    where: { ancestorId: userId, depth },
    select: { descendantId: true },
  });

  if (closures.length === 0) return [];

  return db.user.findMany({
    where: { id: { in: closures.map((c) => c.descendantId) } },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      subscription: { select: { plan: true, status: true } },
    },
  });
}

export async function countPersonalSponsors(userId: string) {
  const direct = await db.user.findMany({
    where: { sponsorId: userId },
    select: {
      subscription: { select: { plan: true, status: true } },
    },
  });

  return direct.filter(
    (u) =>
      u.subscription?.status === "ACTIVE" &&
      (u.subscription.plan === "PLUS" || u.subscription.plan === "PRO")
  ).length;
}
