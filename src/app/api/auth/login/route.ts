import { NextResponse } from "next/server";
import { login } from "@/lib/auth";
import { ensureDemoData } from "@/lib/ensure-seed";

export async function POST(req: Request) {
  try {
    // Ensure demo data exists (for Vercel where /tmp is ephemeral)
    await ensureDemoData();
  } catch (error) {
    console.error("Demo data seeding failed, will use fallback auth:", error instanceof Error ? error.message : "");
  }

  try {
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
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Login failed: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 }
    );
  }
}
