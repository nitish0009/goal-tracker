import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { Role, GoalSheetStatus, CyclePhase } from "@/generated/prisma/client";
import { getCurrentCheckInPhase } from "@/lib/cycles";
import { getDemoCyclePhase } from "@/lib/demo-phase";

export async function GET(req: Request) {
  const auth = await requireSession([Role.ADMIN, Role.MANAGER]);
  if (!auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const year = parseInt(new URL(req.url).searchParams.get("year") ?? "2026", 10);
  const demoPhase = await getDemoCyclePhase();
  const checkInPhase =
    getCurrentCheckInPhase(year, new Date(), demoPhase) ?? CyclePhase.Q1_CHECKIN;

  const employees = await prisma.user.findMany({
    where: { role: Role.EMPLOYEE },
    include: {
      goalSheets: { where: { year }, include: { checkIns: true } },
      manager: { select: { name: true } },
    },
  });

  const completion = employees.map((e) => {
    const sheet = e.goalSheets[0];
    const checkIn = sheet?.checkIns.find((c) => c.quarter === checkInPhase);
    return {
      employeeId: e.id,
      employeeName: e.name,
      managerName: e.manager?.name ?? "—",
      goalSheetStatus: sheet?.status ?? "NO_SHEET",
      employeeCheckInDone: !!checkIn?.employeeCompletedAt,
      managerCheckInDone: !!checkIn?.managerCompletedAt,
    };
  });

  const stats = {
    totalEmployees: employees.length,
    goalsSubmitted: employees.filter((e) => {
      const st = e.goalSheets[0]?.status;
      return st === GoalSheetStatus.SUBMITTED || st === GoalSheetStatus.APPROVED;
    }).length,
    goalsApproved: employees.filter(
      (e) => e.goalSheets[0]?.status === GoalSheetStatus.APPROVED
    ).length,
    employeeCheckInsComplete: completion.filter((c) => c.employeeCheckInDone).length,
    managerCheckInsComplete: completion.filter((c) => c.managerCheckInDone).length,
    activeQuarter: checkInPhase,
  };

  return NextResponse.json({ completion, stats, year });
}
