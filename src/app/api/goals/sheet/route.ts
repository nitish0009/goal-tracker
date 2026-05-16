import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, logAudit } from "@/lib/auth";
import { Role, GoalSheetStatus } from "@/generated/prisma/client";
import { validateGoals, type GoalInput } from "@/lib/goals";
import { isGoalSettingOpen } from "@/lib/cycles";
import { getDemoCyclePhase } from "@/lib/demo-phase";

export async function GET(req: Request) {
  const auth = await requireSession();
  if (!auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") ?? "2026", 10);
  const employeeId =
    searchParams.get("employeeId") ??
    (auth.session.role === Role.EMPLOYEE ? auth.session.id : null);

  if (!employeeId) {
    return NextResponse.json({ error: "employeeId required" }, { status: 400 });
  }

  if (
    auth.session.role === Role.EMPLOYEE &&
    employeeId !== auth.session.id
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (auth.session.role === Role.MANAGER && employeeId !== auth.session.id) {
    const report = await prisma.user.findFirst({
      where: { id: employeeId, managerId: auth.session.id },
    });
    if (!report) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let sheet = await prisma.goalSheet.findUnique({
    where: { employeeId_year: { employeeId, year } },
    include: {
      goals: { orderBy: { sortOrder: "asc" } },
      employee: { select: { id: true, name: true, email: true, department: true } },
      checkIns: true,
    },
  });

  if (!sheet && auth.session.role === Role.EMPLOYEE && employeeId === auth.session.id) {
    sheet = await prisma.goalSheet.create({
      data: { employeeId, year, status: GoalSheetStatus.DRAFT },
      include: {
        goals: { orderBy: { sortOrder: "asc" } },
        employee: { select: { id: true, name: true, email: true, department: true } },
        checkIns: true,
      },
    });
  }

  const demoPhase = await getDemoCyclePhase();
  const goalSettingOpen = isGoalSettingOpen(year, new Date(), demoPhase);

  return NextResponse.json({ sheet, goalSettingOpen, year });
}

export async function PUT(req: Request) {
  const auth = await requireSession([Role.EMPLOYEE, Role.MANAGER, Role.ADMIN]);
  if (!auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json();
  const { year = 2026, goals, employeeId: bodyEmployeeId } = body as {
    year?: number;
    goals: GoalInput[];
    employeeId?: string;
  };

  const employeeId =
    auth.session.role === Role.EMPLOYEE ? auth.session.id : bodyEmployeeId;
  if (!employeeId) {
    return NextResponse.json({ error: "employeeId required" }, { status: 400 });
  }

  const sheet = await prisma.goalSheet.findUnique({
    where: { employeeId_year: { employeeId, year } },
    include: { goals: true },
  });

  if (!sheet) {
    return NextResponse.json({ error: "Goal sheet not found" }, { status: 404 });
  }

  const locked =
    sheet.status === GoalSheetStatus.APPROVED && auth.session.role !== Role.ADMIN;
  if (locked) {
    return NextResponse.json(
      { error: "Goals are locked. Contact Admin to unlock." },
      { status: 403 }
    );
  }

  if (sheet.status === GoalSheetStatus.SUBMITTED && auth.session.role === Role.EMPLOYEE) {
    return NextResponse.json(
      { error: "Sheet submitted — awaiting manager approval." },
      { status: 403 }
    );
  }

  const demoPhase = await getDemoCyclePhase();
  const canEdit =
    auth.session.role === Role.ADMIN ||
    auth.session.role === Role.MANAGER ||
    (auth.session.role === Role.EMPLOYEE &&
      isGoalSettingOpen(year, new Date(), demoPhase) &&
      (sheet.status === GoalSheetStatus.DRAFT ||
        sheet.status === GoalSheetStatus.RETURNED));

  if (!canEdit) {
    return NextResponse.json({ error: "Goal setting window is closed." }, { status: 403 });
  }

  const sharedOnly =
    auth.session.role === Role.EMPLOYEE &&
    goals.some((g) => g.isShared);
  const validation = validateGoals(goals, {
    weightOnly: sharedOnly && goals.every((g) => g.isShared),
  });
  if (!validation.valid) {
    return NextResponse.json({ error: validation.errors.join(" ") }, { status: 400 });
  }

  for (const g of goals) {
    if (g.isShared && auth.session.role === Role.EMPLOYEE) {
      const existing = sheet.goals.find((x) => x.id === g.id);
      if (existing?.isShared) continue;
    }
  }

  await prisma.goal.deleteMany({ where: { goalSheetId: sheet.id } });

  const created = await prisma.$transaction(
    goals.map((g, i) =>
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
          isPrimaryOwner: g.isPrimaryOwner ?? true,
          sortOrder: i,
        },
      })
    )
  );

  if (sheet.lockedAt) {
    for (const g of created) {
      await logAudit(auth.session.id, "Goal", g.id, "bulk_update", null, g.title);
    }
  }

  const updated = await prisma.goalSheet.findUnique({
    where: { id: sheet.id },
    include: { goals: { orderBy: { sortOrder: "asc" } } },
  });

  return NextResponse.json({ sheet: updated });
}
