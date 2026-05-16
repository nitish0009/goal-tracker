"use client";

import { useEffect, useState } from "react";

export function AdminDashboardPage() {
  const [data, setData] = useState<{
    stats: Record<string, number | string>;
    completion: {
      employeeName: string;
      managerName: string;
      goalSheetStatus: string;
      employeeCheckInDone: boolean;
      managerCheckInDone: boolean;
    }[];
  } | null>(null);

  useEffect(() => {
    fetch("/api/admin/dashboard?year=2026")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) return <p>Loading…</p>;

  const s = data.stats;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Completion Dashboard</h1>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Employees", s.totalEmployees],
          ["Goals approved", s.goalsApproved],
          ["Employee check-ins", s.employeeCheckInsComplete],
          ["Manager check-ins", s.managerCheckInsComplete],
        ].map(([label, val]) => (
          <div key={String(label)} className="rounded-xl bg-white p-4 shadow-sm border">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-2xl font-bold text-indigo-700">{val}</p>
          </div>
        ))}
      </div>
      <p className="mb-4 text-sm text-slate-600">Active quarter: {s.activeQuarter}</p>
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left">Employee</th>
              <th className="px-4 py-3 text-left">Manager</th>
              <th className="px-4 py-3 text-left">Goals</th>
              <th className="px-4 py-3 text-left">Emp. check-in</th>
              <th className="px-4 py-3 text-left">Mgr. check-in</th>
            </tr>
          </thead>
          <tbody>
            {data.completion.map((c, i) => (
              <tr key={i} className="border-t">
                <td className="px-4 py-3">{c.employeeName}</td>
                <td className="px-4 py-3">{c.managerName}</td>
                <td className="px-4 py-3">{c.goalSheetStatus}</td>
                <td className="px-4 py-3">{c.employeeCheckInDone ? "✓" : "—"}</td>
                <td className="px-4 py-3">{c.managerCheckInDone ? "✓" : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
