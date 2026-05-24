import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  optOutPersonalization: z.boolean().optional(),
  toneOverride: z.string().max(200).nullable().optional(),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = schema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const settings = await db.personaSettings.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      optOutPersonalization: body.data.optOutPersonalization ?? false,
      toneOverride: body.data.toneOverride ?? null,
    },
    update: {
      ...(body.data.optOutPersonalization !== undefined && {
        optOutPersonalization: body.data.optOutPersonalization,
      }),
      ...(body.data.toneOverride !== undefined && {
        toneOverride: body.data.toneOverride,
      }),
    },
  });

  return NextResponse.json({ ok: true, settings });
}
