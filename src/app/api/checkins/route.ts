import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, logAudit } from "@/lib/auth";
import { Role, GoalSheetStatus, CyclePhase } from "@/generated/prisma/client";
import { isCheckInOpen, getCurrentCheckInPhase } from "@/lib/cycles";
import { getDemoCyclePhase } from "@/lib/demo-phase";
import { computeProgressScore } from "@/lib/progress";

export async function GET(req: Request) {
  const auth = await requireSession();
  if (!auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const sheetId = searchParams.get("sheetId");
  if (!sheetId) return NextResponse.json({ error: "sheetId required" }, { status: 400 });

  const checkIns = await prisma.checkIn.findMany({
    where: { goalSheetId: sheetId },
    include: { manager: { select: { name: true } } },
  });

  return NextResponse.json({ checkIns });
}

export async function PUT(req: Request) {
  const auth = await requireSession();
  if (!auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json();
  const {
    sheetId,
    quarter,
    goals: goalUpdates,
    managerComment,
    markEmployeeComplete,
    markManagerComplete,
  } = body;

  const sheet = await prisma.goalSheet.findUnique({
    where: { id: sheetId },
    include: { goals: true, employee: true },
  });

  if (!sheet) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (sheet.status !== GoalSheetStatus.APPROVED) {
    return NextResponse.json({ error: "Goals must be approved first." }, { status: 400 });
  }

  const year = sheet.year;
  const demoPhase = await getDemoCyclePhase();
  const activePhase = getCurrentCheckInPhase(year, new Date(), demoPhase);

  if (auth.session.role === Role.EMPLOYEE) {
    if (sheet.employeeId !== auth.session.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!isCheckInOpen(year, new Date(), demoPhase)) {
      return NextResponse.json({ error: "Check-in window is closed." }, { status: 403 });
    }
    if (quarter !== activePhase) {
      return NextResponse.json({ error: "Invalid check-in quarter for current window." }, { status: 400 });
    }

    for (const u of goalUpdates ?? []) {
      const goal = sheet.goals.find((g) => g.id === u.id);
      if (!goal) continue;

      const canEditAchievement = !goal.isShared || goal.isPrimaryOwner;
      const updateData: Record<string, unknown> = {
        progressStatus: u.progressStatus,
      };

      if (canEditAchievement) {
        if (!goal.isShared) {
          updateData.actualAchievement = u.actualAchievement;
          updateData.completionDate = u.completionDate ? new Date(u.completionDate) : null;
        } else if (goal.isPrimaryOwner) {
          updateData.actualAchievement = u.actualAchievement;
          updateData.completionDate = u.completionDate ? new Date(u.completionDate) : null;
        }
      } else if (goal.isShared) {
        updateData.weightage = u.weightage ?? goal.weightage;
      }

      if (goal.isShared && u.weightage !== undefined) {
        updateData.weightage = u.weightage;
      }

      await prisma.goal.update({ where: { id: goal.id }, data: updateData });

      if (goal.isShared && goal.sharedGroupId && goal.isPrimaryOwner && canEditAchievement) {
        await prisma.goal.updateMany({
          where: {
            sharedGroupId: goal.sharedGroupId,
            id: { not: goal.id },
          },
          data: {
            actualAchievement: u.actualAchievement,
            completionDate: u.completionDate ? new Date(u.completionDate) : null,
            progressStatus: u.progressStatus,
          },
        });
      }

      if (sheet.lockedAt) {
        await logAudit(
          auth.session.id,
          "Goal",
          goal.id,
          "checkin_update",
          goal.actualAchievement,
          u.actualAchievement ?? null
        );
      }
    }

    await prisma.checkIn.upsert({
      where: { goalSheetId_quarter: { goalSheetId: sheetId, quarter } },
      create: {
        goalSheetId: sheetId,
        quarter,
        employeeCompletedAt: markEmployeeComplete ? new Date() : null,
      },
      update: {
        employeeCompletedAt: markEmployeeComplete ? new Date() : undefined,
      },
    });
  }

  if (auth.session.role === Role.MANAGER || auth.session.role === Role.ADMIN) {
    if (
      auth.session.role === Role.MANAGER &&
      sheet.employee.managerId !== auth.session.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.checkIn.upsert({
      where: { goalSheetId_quarter: { goalSheetId: sheetId, quarter } },
      create: {
        goalSheetId: sheetId,
        quarter,
        managerComment: managerComment ?? null,
        managerId: auth.session.id,
        managerCompletedAt: markManagerComplete ? new Date() : null,
      },
      update: {
        managerComment: managerComment ?? undefined,
        managerId: auth.session.id,
        managerCompletedAt: markManagerComplete ? new Date() : null,
      },
    });
  }

  const updated = await prisma.goalSheet.findUnique({
    where: { id: sheetId },
    include: {
      goals: { orderBy: { sortOrder: "asc" } },
      checkIns: true,
    },
  });

  const scores = updated?.goals.map((g) => ({
    goalId: g.id,
    score: computeProgressScore(
      g.uomType,
      g.target,
      g.actualAchievement,
      g.deadline,
      g.completionDate
    ),
  }));

  return NextResponse.json({ sheet: updated, scores });
}
