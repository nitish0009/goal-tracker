"use client";

import { useEffect, useState } from "react";

type Log = {
  id: string;
  entityType: string;
  entityId: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  user: { name: string; email: string; role: string };
};

export default function AuditPage() {
  const [logs, setLogs] = useState<Log[]>([]);

  useEffect(() => {
    fetch("/api/admin/audit")
      .then((r) => r.json())
      .then((d) => setLogs(d.logs ?? []));
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Audit Trail</h1>
      <p className="mb-4 text-sm text-slate-600">
        Changes to goals after lock date — who changed what and when.
      </p>
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <table className="w-full text-xs">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left">When</th>
              <th className="px-3 py-2 text-left">User</th>
              <th className="px-3 py-2 text-left">Entity</th>
              <th className="px-3 py-2 text-left">Field</th>
              <th className="px-3 py-2 text-left">Change</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-t">
                <td className="px-3 py-2">{new Date(l.createdAt).toLocaleString()}</td>
                <td className="px-3 py-2">
                  {l.user.name} ({l.user.role})
                </td>
                <td className="px-3 py-2">
                  {l.entityType} {l.entityId.slice(0, 8)}…
                </td>
                <td className="px-3 py-2">{l.field}</td>
                <td className="px-3 py-2">
                  {l.oldValue ?? "—"} → {l.newValue ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
