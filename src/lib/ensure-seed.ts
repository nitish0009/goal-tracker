import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { Role, UomType, GoalSheetStatus } from "@/generated/prisma/client";
import { getCycleWindows } from "./cycles";

let seedAttempted = false;
let seedFailed = false;

// Fallback demo users if database fails
const FALLBACK_DEMO_USERS: Record<string, { name: string; role: Role; password: string; department: string }> = {
  "admin@atomquest.demo": {
    password: "demo123",
    name: "Priya Sharma (HR Admin)",
    role: Role.ADMIN,
    department: "Human Resources",
  },
  "manager@atomquest.demo": {
    password: "demo123",
    name: "Rajesh Kumar (L1 Manager)",
    role: Role.MANAGER,
    department: "Sales",
  },
  "employee@atomquest.demo": {
    password: "demo123",
    name: "Anita Desai",
    role: Role.EMPLOYEE,
    department: "Sales",
  },
};

export async function ensureDemoData() {
  // Only try once per process
  if (seedAttempted) return;
  seedAttempted = true;

  try {
    // Check if demo data already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: "admin@atomquest.demo" },
    });

    if (existingUser) {
      return; // Data already exists
    }

    // Seed demo data
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

    // Create performance cycles
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

    // Create goal sheets for employees
    const cycle = await prisma.performanceCycle.findFirst({
      where: { phase: "GOAL_SETTING" },
      orderBy: { windowStart: "desc" },
    });

    if (cycle) {
      await prisma.goalSheet.create({
        data: {
          year,
          employeeId: employee.id,
          status: GoalSheetStatus.DRAFT,
          goals: {
            create: [
              {
                thrustArea: "Revenue Growth",
                title: "Increase regional sales",
                description: "Grow Q1-Q4 revenue in assigned territory",
                target: "5000000",
                uomType: UomType.NUMERIC_MIN,
                weightage: 40,
              },
              {
                thrustArea: "Customer Experience",
                title: "Improve NPS score",
                description: "Quarterly NPS survey target",
                target: "85",
                uomType: UomType.PERCENT_MIN,
                weightage: 30,
              },
              {
                thrustArea: "Operational Excellence",
                title: "Process optimization",
                description: "Reduce order processing time by 20%",
                target: "20",
                uomType: UomType.PERCENT_MAX,
                weightage: 30,
              },
            ],
          },
        },
      });
    }

    console.log("✓ Demo data seeded successfully");
  } catch (error) {
    seedFailed = true;
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("⚠ Could not seed demo data:", errorMsg);
    console.error("⚠ Falling back to memory-based fallback auth");
  }
}

// Fallback auth when database is unavailable
export function getFallbackUser(email: string, password: string): { name: string; role: Role; department: string; id: string } | null {
  const user = FALLBACK_DEMO_USERS[email as keyof typeof FALLBACK_DEMO_USERS];
  if (!user || user.password !== password) return null;
  return {
    name: user.name,
    role: user.role,
    department: user.department,
    id: `fallback-${email.split("@")[0]}`, // Generate a stable ID
  };
}
