"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useState } from "react";

type User = { name: string; email: string; role: string };

const navByRole: Record<string, { href: string; label: string }[]> = {
  EMPLOYEE: [
    { href: "/dashboard", label: "My Goals" },
    { href: "/dashboard/check-in", label: "Quarterly Check-in" },
  ],
  MANAGER: [
    { href: "/dashboard", label: "Team Overview" },
    { href: "/dashboard/approvals", label: "Approvals" },
    { href: "/dashboard/check-ins", label: "Check-ins" },
  ],
  ADMIN: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/shared-goals", label: "Shared Goals" },
    { href: "/dashboard/reports", label: "Reports" },
    { href: "/dashboard/audit", label: "Audit Trail" },
  ],
};

export function AppShell({ user, children }: { user: User; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [demoPhase, setDemoPhase] = useState("");

  const nav = navByRole[user.role] ?? [];

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  async function setPhase(phase: string) {
    setDemoPhase(phase);
    await fetch("/api/demo/phase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phase: phase || null }),
    });
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <div>
            <Link href="/dashboard" className="text-lg font-semibold text-indigo-700">
              AtomQuest Goals
            </Link>
            <p className="text-xs text-slate-500">In-House Goal Setting & Tracking</p>
          </div>
          <nav className="flex flex-wrap gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  pathname === item.href
                    ? "bg-indigo-100 text-indigo-800"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-slate-600">
              Demo cycle:
              <select
                value={demoPhase}
                onChange={(e) => setPhase(e.target.value)}
                className="rounded border border-slate-300 px-2 py-1 text-xs"
              >
                <option value="">Calendar</option>
                <option value="GOAL_SETTING">Goal Setting (May)</option>
                <option value="Q1_CHECKIN">Q1 (July)</option>
                <option value="Q2_CHECKIN">Q2 (Oct)</option>
                <option value="Q3_CHECKIN">Q3 (Jan)</option>
                <option value="Q4_CHECKIN">Q4 (Mar–Apr)</option>
              </select>
            </label>
            <span className="text-sm text-slate-600">
              {user.name}{" "}
              <span className="rounded bg-slate-200 px-2 py-0.5 text-xs">{user.role}</span>
            </span>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
