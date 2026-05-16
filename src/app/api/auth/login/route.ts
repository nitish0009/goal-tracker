import { NextResponse } from "next/server";
import { login } from "@/lib/auth";
import { ensureDemoData } from "@/lib/ensure-seed";

export async function POST(req: Request) {
  // Ensure demo data exists (for Vercel where /tmp is ephemeral)
  await ensureDemoData();

  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }
  const user = await login(email, password);
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
}
