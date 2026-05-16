import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { Role } from "@/generated/prisma/client";

export async function GET() {
  const auth = await requireSession([Role.ADMIN]);
  if (!auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: { select: { name: true, email: true, role: true } } },
  });

  return NextResponse.json({ logs });
}
