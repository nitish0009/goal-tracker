import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, GoalSheetStatus, Role, UomType } from "../src/generated/prisma/client";
import { getCycleWindows } from "../src/lib/cycles";

let connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // Use /tmp for Vercel (persists during deployment), ./ for local dev
  const dbPath = process.env.NODE_ENV === "production" ? "/tmp/dev.db" : "./dev.db";
  connectionString = `file:${dbPath}`;
}

const adapter = connectionString.startsWith("file:")
  ? new PrismaBetterSqlite3({ url: connectionString })
  : new PrismaPg({ connectionString });

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

  await prisma.user.create({
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
  for (const window of getCycleWindows(year)) {
    await prisma.performanceCycle.create({
      data: {
        year,
        phase: window.phase,
        windowStart: window.windowStart,
        windowEnd: window.windowEnd,
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
            description: "Grow Q1-Q4 revenue in assigned territory",
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
            title: "Process optimization",
            description: "Reduce order processing time by 20%",
            uomType: UomType.PERCENT_MAX,
            target: "20",
            weightage: 30,
            sortOrder: 2,
          },
        ],
      },
    },
  });

  console.log("Database seeded successfully with demo accounts.");
  console.log({
    admin: admin.email,
    manager: manager.email,
    employee: employee.email,
    demoPassword: "demo123",
    goalSheetId: sheet.id,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });