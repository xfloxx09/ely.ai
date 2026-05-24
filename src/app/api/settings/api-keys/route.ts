import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { effectivePlanForUser } from "@/lib/auth-utils";
import { encryptSecret } from "@/lib/crypto/secrets";
import { z } from "zod";

const schema = z.object({
  provider: z.enum(["openai", "anthropic", "google"]),
  apiKey: z.string().min(8).max(512),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const keys = await db.userApiKey.findMany({
    where: { userId: session.user.id },
    select: { provider: true, createdAt: true },
  });

  const credits = await db.elyCredits.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json({
    providers: keys.map((k) => k.provider),
    credits: credits?.balance ?? 0,
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { subscription: true },
  });
  const plan = effectivePlanForUser(
    user?.subscription?.plan ?? "FREE",
    user?.role
  );
  if (plan !== "PRO" && user?.role !== "ADMIN") {
    return NextResponse.json(
      { error: "BYOK API keys require Ely Pro" },
      { status: 403 }
    );
  }

  const body = schema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    const encryptedKey = encryptSecret(body.data.apiKey);
    await db.userApiKey.upsert({
      where: {
        userId_provider: {
          userId: session.user.id,
          provider: body.data.provider,
        },
      },
      create: {
        userId: session.user.id,
        provider: body.data.provider,
        encryptedKey,
      },
      update: { encryptedKey },
    });
    return NextResponse.json({ ok: true, provider: body.data.provider });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error
            ? e.message
            : "Could not encrypt key — set ENCRYPTION_KEY",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const provider = searchParams.get("provider");
  if (!provider) {
    return NextResponse.json({ error: "provider required" }, { status: 400 });
  }

  await db.userApiKey.deleteMany({
    where: { userId: session.user.id, provider },
  });

  return NextResponse.json({ ok: true });
}
