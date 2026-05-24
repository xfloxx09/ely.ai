import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { customAlphabet } from "nanoid";
import { db } from "@/lib/db";
import { attachUserToGenealogy } from "@/lib/mlm/genealogy";
import { z } from "zod";

const nanoid = customAlphabet("23456789ABCDEFGHJKLMNPQRSTUVWXYZ", 8);

const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  referralCode: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    let sponsorId: string | null = null;
    if (parsed.data.referralCode) {
      const sponsor = await db.user.findUnique({
        where: { referralCode: parsed.data.referralCode.toUpperCase() },
        select: { id: true },
      });
      if (!sponsor) {
        return NextResponse.json(
          { error: "Invalid referral code" },
          { status: 400 }
        );
      }
      sponsorId = sponsor.id;
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    let referralCode = nanoid();
    while (await db.user.findUnique({ where: { referralCode } })) {
      referralCode = nanoid();
    }

    const user = await db.user.create({
      data: {
        name: parsed.data.name,
        email,
        passwordHash,
        referralCode,
        sponsorId,
        onboardingStep: "PERSONALITY",
        subscription: {
          create: { plan: "FREE", status: "ACTIVE" },
        },
        personaSettings: { create: {} },
        avatarProfile: { create: {} },
        elyCredits: { create: { balance: 0 } },
      },
    });

    await attachUserToGenealogy(user.id, sponsorId);

    return NextResponse.json({ ok: true, userId: user.id });
  } catch (e) {
    console.error("Register error:", e);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
