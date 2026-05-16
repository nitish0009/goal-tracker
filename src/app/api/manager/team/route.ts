import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { Role } from "@/generated/prisma/client";

export async function GET(req: Request) {
  const auth = await requireSession([Role.MANAGER, Role.ADMIN]);
  if (!auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  // For fallback users (when database is unavailable), return empty team
  if (auth.session.id.startsWith("fallback-")) {
    return NextResponse.json([]);
  }

  const year = parseInt(new URL(req.url).searchParams.get("year") ?? "2026", 10);

  const where =
    auth.session.role === Role.MANAGER
      ? { managerId: auth.session.id }
      : {};

  const team = await prisma.user.findMany({
    where: { ...where, role: Role.EMPLOYEE },
    select: {
      id: true,
      name: true,
      email: true,
      department: true,
      goalSheets: {
        where: { year },
        include: {
          goals: true,
          checkIns: true,
        },
      },
    },
  });

  return NextResponse.json({ team, year });
}
