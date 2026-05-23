import { NextResponse } from "next/server";
import { runMonthlyCommissions } from "@/lib/mlm/commissions";

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runMonthlyCommissions();
  return NextResponse.json({ ok: true, ...result });
}
