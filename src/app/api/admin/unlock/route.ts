import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, logAudit } from "@/lib/auth";
import { Role, GoalSheetStatus } from "@/generated/prisma/client";

export async function POST(req: Request) {
  const auth = await requireSession([Role.ADMIN]);
  if (!auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { sheetId } = await req.json();
  const sheet = await prisma.goalSheet.findUnique({ where: { id: sheetId } });
  if (!sheet) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.goalSheet.update({
    where: { id: sheetId },
    data: {
      status: GoalSheetStatus.RETURNED,
      lockedAt: null,
      approvedAt: null,
      approvedById: null,
    },
  });

  await logAudit(auth.session.id, "GoalSheet", sheetId, "unlock", "APPROVED", "RETURNED");

  return NextResponse.json({ sheet: updated });
}
