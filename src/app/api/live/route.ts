import { NextResponse } from "next/server";

/** Liveness probe — no database, confirms the Node process is up. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "ely",
    timestamp: new Date().toISOString(),
  });
}
