import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { Role, GoalSheetStatus } from "@/generated/prisma/client";
import { validateGoals } from "@/lib/goals";
import { isGoalSettingOpen } from "@/lib/cycles";
import { getDemoCyclePhase } from "@/lib/demo-phase";

export async function POST(req: Request) {
  const auth = await requireSession([Role.EMPLOYEE]);
  if (!auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { year = 2026 } = await req.json();
  const demoPhase = await getDemoCyclePhase();
  if (!isGoalSettingOpen(year, new Date(), demoPhase)) {
    return NextResponse.json({ error: "Goal setting window is closed." }, { status: 403 });
  }

  const sheet = await prisma.goalSheet.findUnique({
    where: { employeeId_year: { employeeId: auth.session.id, year } },
    include: { goals: true },
  });

  if (!sheet) {
    return NextResponse.json({ error: "Create goals before submitting." }, { status: 400 });
  }

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

  const updated = await prisma.goalSheet.update({
    where: { id: sheet.id },
    data: { status: GoalSheetStatus.SUBMITTED, submittedAt: new Date() },
    include: { goals: true, employee: { select: { name: true, email: true } } },
  });

  return NextResponse.json({ sheet: updated });
}
