import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { Role, GoalSheetStatus, UomType } from "@/generated/prisma/client";
import { validateGoals } from "@/lib/goals";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  const auth = await requireSession([Role.ADMIN, Role.MANAGER]);
  if (!auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const {
    title,
    description,
    thrustArea,
    uomType,
    target,
    employeeIds,
    weightage = 20,
    year = 2026,
  } = await req.json();

  if (!title || !thrustArea || !uomType || !target || !employeeIds?.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const sharedGroupId = randomUUID();

  await prisma.sharedGoalPush.create({
    data: {
      title,
      description: description ?? null,
      thrustArea,
      uomType: uomType as UomType,
      target,
      pushedById: auth.session.id,
      sharedGroupId,
    },
  });

  const results = [];

  for (let i = 0; i < employeeIds.length; i++) {
    const empId = employeeIds[i];
    let sheet = await prisma.goalSheet.findUnique({
      where: { employeeId_year: { employeeId: empId, year } },
      include: { goals: true },
    });

    if (!sheet) {
      sheet = await prisma.goalSheet.create({
        data: { employeeId: empId, year, status: GoalSheetStatus.DRAFT },
        include: { goals: true },
      });
    }

    if (sheet.status === GoalSheetStatus.APPROVED) {
      results.push({ employeeId: empId, error: "Sheet locked — skipped" });
      continue;
    }

    const existingGoals = sheet.goals.map((g) => ({
      id: g.id,
      thrustArea: g.thrustArea,
      title: g.title,
      description: g.description ?? undefined,
      uomType: g.uomType,
      target: g.target,
      weightage: g.weightage,
      isShared: g.isShared,
      sharedGroupId: g.sharedGroupId,
      isPrimaryOwner: g.isPrimaryOwner,
    }));

    const newGoal = {
      thrustArea,
      title,
      description,
      uomType,
      target,
      weightage: Number(weightage),
      isShared: true,
      sharedGroupId,
      isPrimaryOwner: i === 0,
    };

    const merged = [...existingGoals, newGoal];
    const validation = validateGoals(merged);
    if (!validation.valid) {
      results.push({ employeeId: empId, error: validation.errors[0] });
      continue;
    }

    await prisma.goal.deleteMany({ where: { goalSheetId: sheet.id } });
    await prisma.$transaction(
      merged.map((g, idx) =>
        prisma.goal.create({
          data: {
            goalSheetId: sheet!.id,
            thrustArea: g.thrustArea,
            title: g.title,
            description: g.description ?? null,
            uomType: g.uomType as UomType,
            target: g.target,
            weightage: g.weightage,
            isShared: g.isShared ?? false,
            sharedGroupId: g.sharedGroupId ?? null,
            isPrimaryOwner: g.isPrimaryOwner ?? true,
            sortOrder: idx,
          },
        })
      )
    );

    results.push({ employeeId: empId, ok: true });
  }

  return NextResponse.json({ sharedGroupId, results });
}
