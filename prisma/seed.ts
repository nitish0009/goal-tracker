import "dotenv/config";
import { PrismaClient, Role, GoalSheetStatus, UomType } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import { getCycleWindows } from "../src/lib/cycles";

const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.checkIn.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.goalSheet.deleteMany();
  await prisma.sharedGoalPush.deleteMany();
  await prisma.performanceCycle.deleteMany();
  await prisma.user.deleteMany();

  const hash = await bcrypt.hash("demo123", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@atomquest.demo",
      passwordHash: hash,
      name: "Priya Sharma (HR Admin)",
      role: Role.ADMIN,
      department: "Human Resources",
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: "manager@atomquest.demo",
      passwordHash: hash,
      name: "Rajesh Kumar (L1 Manager)",
      role: Role.MANAGER,
      department: "Sales",
    },
  });

  const employee = await prisma.user.create({
    data: {
      email: "employee@atomquest.demo",
      passwordHash: hash,
      name: "Anita Desai",
      role: Role.EMPLOYEE,
      department: "Sales",
      managerId: manager.id,
    },
  });

  const employee2 = await prisma.user.create({
    data: {
      email: "employee2@atomquest.demo",
      passwordHash: hash,
      name: "Vikram Patel",
      role: Role.EMPLOYEE,
      department: "Sales",
      managerId: manager.id,
    },
  });

  const year = 2026;
  for (const w of getCycleWindows(year)) {
    await prisma.performanceCycle.create({
      data: {
        year,
        phase: w.phase,
        windowStart: w.windowStart,
        windowEnd: w.windowEnd,
        isActive: true,
      },
    });
  }

  const sheet = await prisma.goalSheet.create({
    data: {
      employeeId: employee.id,
      year,
      status: GoalSheetStatus.DRAFT,
      goals: {
        create: [
          {
            thrustArea: "Revenue Growth",
            title: "Increase regional sales",
            description: "Grow Q1–Q4 revenue in assigned territory",
            uomType: UomType.NUMERIC_MIN,
            target: "5000000",
            weightage: 40,
            sortOrder: 0,
          },
          {
            thrustArea: "Customer Experience",
            title: "Improve NPS score",
            description: "Quarterly NPS survey target",
            uomType: UomType.PERCENT_MIN,
            target: "85",
            weightage: 30,
            sortOrder: 1,
          },
          {
            thrustArea: "Operational Excellence",
            title: "Reduce order TAT",
            uomType: UomType.NUMERIC_MAX,
            target: "48",
            weightage: 30,
            sortOrder: 2,
          },
        ],
      },
    },
  });

  console.log("Seed complete.");
  console.log("Demo logins (password: demo123):");
  console.log("  Employee:", employee.email);
  console.log("  Manager:", manager.email);
  console.log("  Admin:", admin.email);
  console.log("  Second employee:", employee2.email);
  console.log("Sample goal sheet:", sheet.id);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
