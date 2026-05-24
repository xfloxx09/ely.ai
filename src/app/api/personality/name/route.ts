import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  companionName: z.string().min(1).max(40),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = schema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }

  await db.avatarProfile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      companionName: body.data.companionName.trim(),
    },
    update: {
      companionName: body.data.companionName.trim(),
    },
  });

  return NextResponse.json({ ok: true });
}
