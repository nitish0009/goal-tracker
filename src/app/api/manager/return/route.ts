import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, logAudit } from "@/lib/auth";
import { Role, GoalSheetStatus } from "@/generated/prisma/client";

export async function POST(req: Request) {
  const auth = await requireSession([Role.MANAGER, Role.ADMIN]);
  if (!auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { sheetId, comment } = await req.json();
  const sheet = await prisma.goalSheet.findUnique({
    where: { id: sheetId },
    include: { employee: true },
  });

  if (!sheet) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (auth.session.role === Role.MANAGER && sheet.employee.managerId !== auth.session.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.goalSheet.update({
    where: { id: sheetId },
    data: { status: GoalSheetStatus.RETURNED, submittedAt: null },
  });

  await logAudit(
    auth.session.id,
    "GoalSheet",
    sheetId,
    "return_comment",
    null,
    comment ?? "Returned for rework"
  );

  return NextResponse.json({ sheet: updated });
}
