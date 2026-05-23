import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    const users = await db.user.count();
    const admins = await db.user.count({ where: { role: "ADMIN" } });
    return NextResponse.json({
      ok: true,
      database: "connected",
      users,
      admins,
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        database: "error",
        message: e instanceof Error ? e.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
