import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { Role } from "@/generated/prisma/client";
import { computeProgressScore } from "@/lib/progress";

export async function GET(req: Request) {
  const auth = await requireSession([Role.ADMIN, Role.MANAGER]);
  if (!auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const year = parseInt(new URL(req.url).searchParams.get("year") ?? "2026", 10);
  const format = new URL(req.url).searchParams.get("format");

  const sheets = await prisma.goalSheet.findMany({
    where: { year, status: "APPROVED" },
    include: {
      employee: { select: { name: true, email: true, department: true } },
      goals: true,
    },
  });

  const rows: string[][] = [
    [
      "Employee",
      "Email",
      "Department",
      "Goal",
      "Thrust Area",
      "UoM",
      "Target",
      "Actual",
      "Status",
      "Progress %",
    ],
  ];

  for (const sheet of sheets) {
    for (const g of sheet.goals) {
      const score = computeProgressScore(
        g.uomType,
        g.target,
        g.actualAchievement,
        g.deadline,
        g.completionDate
      );
      rows.push([
        sheet.employee.name,
        sheet.employee.email,
        sheet.employee.department ?? "",
        g.title,
        g.thrustArea,
        g.uomType,
        g.target,
        g.actualAchievement ?? "",
        g.progressStatus,
        score != null ? String(score) : "",
      ]);
    }
  }

  if (format === "csv") {
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="achievement-report-${year}.csv"`,
      },
    });
  }

  return NextResponse.json({ rows, year });
}
