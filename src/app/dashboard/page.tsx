import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EmployeeGoalsPage } from "@/components/pages/EmployeeGoalsPage";
import { ManagerTeamPage } from "@/components/pages/ManagerTeamPage";
import { AdminDashboardPage } from "@/components/pages/AdminDashboardPage";
import { Role } from "@/generated/prisma/client";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  if (session.role === Role.EMPLOYEE) {
    return <EmployeeGoalsPage />;
  }
  if (session.role === Role.MANAGER) {
    return <ManagerTeamPage />;
  }
  return <AdminDashboardPage />;
}
