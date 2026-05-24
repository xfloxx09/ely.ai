import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { effectivePlanForUser } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { getAvatarForUser, saveRpmAvatar } from "@/lib/avatar/rpm";
import { evolutionLabel } from "@/lib/avatar/evolution";
import { z } from "zod";

const schema = z.object({
  rpmAvatarId: z.string().min(1),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const avatar = await getAvatarForUser(session.user.id);
  return NextResponse.json({
    avatar,
    evolutionLabel: evolutionLabel(avatar?.evolutionStage ?? 0),
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
      { error: "Ready Player Me avatar requires Ely Pro" },
      { status: 403 }
    );
  }

  const body = schema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid avatar id" }, { status: 400 });
  }

  const result = await saveRpmAvatar(session.user.id, body.data.rpmAvatarId);
  return NextResponse.json({ ok: true, ...result });
}
