"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Member = {
  id: string;
  name: string;
  email: string;
  department: string | null;
  goalSheets: { status: string; goals: unknown[] }[];
};

export function ManagerTeamPage() {
  const [team, setTeam] = useState<Member[]>([]);

  useEffect(() => {
    fetch("/api/manager/team?year=2026")
      .then((r) => r.json())
      .then((d) => setTeam(d.team ?? []));
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Team Overview</h1>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Goal Sheet</th>
              <th className="px-4 py-3">Goals</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {team.map((m) => {
              const sheet = m.goalSheets[0];
              return (
                <tr key={m.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium">{m.name}</td>
                  <td className="px-4 py-3">{m.department ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs ${
                        sheet?.status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-800"
                          : sheet?.status === "SUBMITTED"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100"
                      }`}
                    >
                      {sheet?.status ?? "NO SHEET"}
                    </span>
                  </td>
                  <td className="px-4 py-3">{sheet?.goals?.length ?? 0}</td>
                  <td className="px-4 py-3">
                    {sheet?.status === "SUBMITTED" && (
                      <Link
                        href={`/dashboard/approvals?employeeId=${m.id}`}
                        className="text-indigo-600 hover:underline"
                      >
                        Review
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
