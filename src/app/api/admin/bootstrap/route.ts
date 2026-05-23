import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { customAlphabet } from "nanoid";
import { db } from "@/lib/db";

const nanoid = customAlphabet("23456789ABCDEFGHJKLMNPQRSTUVWXYZ", 8);

export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = (process.env.ADMIN_EMAIL ?? "admin@ely.ai").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "ElyAdmin!2026";
  const name = process.env.ADMIN_NAME ?? "Ely Admin";
  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await db.user.findUnique({ where: { email } });

  if (existing) {
    await db.user.update({
      where: { id: existing.id },
      data: {
        role: "ADMIN",
        rank: "MASTERMIND",
        passwordHash,
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

    const closure = await db.genealogyClosure.findFirst({
      where: { descendantId: existing.id, depth: 0 },
    });
    if (!closure) {
      await db.genealogyClosure.create({
        data: {
          ancestorId: existing.id,
          descendantId: existing.id,
          depth: 0,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      action: "updated",
      email,
      referralCode: existing.referralCode,
    });
  }

  let referralCode = "ELYADMIN";
  while (await db.user.findUnique({ where: { referralCode } })) {
    referralCode = nanoid();
  }

  const user = await db.user.create({
    data: {
      email,
      name,
      passwordHash,
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

  return NextResponse.json({
    ok: true,
    action: "created",
    email,
    referralCode,
  });
}
