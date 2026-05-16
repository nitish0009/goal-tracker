import { NextResponse } from "next/server";
import { CyclePhase } from "@/generated/prisma/client";
import { requireSession } from "@/lib/auth";

const COOKIE = "demo_cycle_phase";

export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { phase } = await req.json();
  const res = NextResponse.json({ ok: true, phase: phase ?? null });
  if (phase && Object.values(CyclePhase).includes(phase)) {
    res.cookies.set(COOKIE, phase, { path: "/", maxAge: 60 * 60 * 24 });
  } else {
    res.cookies.delete(COOKIE);
  }
  return res;
}
