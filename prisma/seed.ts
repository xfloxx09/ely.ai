import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { customAlphabet } from "nanoid";

const db = new PrismaClient();
const nanoid = customAlphabet("23456789ABCDEFGHJKLMNPQRSTUVWXYZ", 8);

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "admin@ely.ai").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "ElyAdmin!2026";
  const name = process.env.ADMIN_NAME ?? "Ely Admin";

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    await db.user.update({
      where: { id: existing.id },
      data: {
        role: "ADMIN",
        rank: "MASTERMIND",
        passwordHash: await bcrypt.hash(password, 12),
        name,
      },
    });
    await db.subscription.upsert({
      where: { userId: existing.id },
      create: {
        userId: existing.id,
        plan: "PRO",
        status: "ACTIVE",
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
      update: { plan: "PRO", status: "ACTIVE" },
    });
    console.log(`Updated admin: ${email}`);
    return;
  }

  let referralCode = "ELYADMIN";
  while (await db.user.findUnique({ where: { referralCode } })) {
    referralCode = nanoid();
  }

  const user = await db.user.create({
    data: {
      email,
      name,
      passwordHash: await bcrypt.hash(password, 12),
      role: "ADMIN",
      rank: "MASTERMIND",
      referralCode,
      xp: 500,
      streak: 30,
      subscription: {
        create: {
          plan: "PRO",
          status: "ACTIVE",
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  await db.genealogyClosure.create({
    data: { ancestorId: user.id, descendantId: user.id, depth: 0 },
  });

  console.log(`Created admin: ${email}`);
  console.log(`Referral code: ${referralCode}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
