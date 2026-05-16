import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, logAudit } from "@/lib/auth";
import { Role, GoalSheetStatus } from "@/generated/prisma/client";
import { validateGoals } from "@/lib/goals";

export async function POST(req: Request) {
  const auth = await requireSession([Role.MANAGER, Role.ADMIN]);
  if (!auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { sheetId, goals } = await req.json();

  const sheet = await prisma.goalSheet.findUnique({
    where: { id: sheetId },
    include: { goals: true, employee: true },
  });

  if (!sheet) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (auth.session.role === Role.MANAGER && sheet.employee.managerId !== auth.session.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (sheet.status !== GoalSheetStatus.SUBMITTED) {
    return NextResponse.json({ error: "Sheet is not pending approval." }, { status: 400 });
  }

  if (goals?.length) {
    const validation = validateGoals(goals);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.errors.join(" ") }, { status: 400 });
    }
    await prisma.goal.deleteMany({ where: { goalSheetId: sheet.id } });
    await prisma.$transaction(
      goals.map((g: { thrustArea: string; title: string; description?: string; uomType: string; target: string; weightage: number; isShared?: boolean; sharedGroupId?: string }, i: number) =>
        prisma.goal.create({
          data: {
            goalSheetId: sheet.id,
            thrustArea: g.thrustArea,
            title: g.title,
            description: g.description ?? null,
            uomType: g.uomType as never,
            target: g.target,
            weightage: g.weightage,
            isShared: g.isShared ?? false,
            sharedGroupId: g.sharedGroupId ?? null,
            sortOrder: i,
          },
        })
      )
    );
  } else {
    const validation = validateGoals(
      sheet.goals.map((g) => ({
        thrustArea: g.thrustArea,
        title: g.title,
        uomType: g.uomType,
        target: g.target,
        weightage: g.weightage,
      }))
    );
    if (!validation.valid) {
      return NextResponse.json({ error: validation.errors.join(" ") }, { status: 400 });
    }
  }

  const updated = await prisma.goalSheet.update({
    where: { id: sheetId },
    data: {
      status: GoalSheetStatus.APPROVED,
      approvedAt: new Date(),
      approvedById: auth.session.id,
      lockedAt: new Date(),
    },
    include: { goals: true, employee: { select: { name: true } } },
  });

  await logAudit(auth.session.id, "GoalSheet", sheetId, "status", "SUBMITTED", "APPROVED");

  return NextResponse.json({ sheet: updated });
}
