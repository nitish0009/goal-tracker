"use client";

import { useEffect, useState } from "react";
import { THRUST_AREAS, UOM_LABELS } from "@/lib/constants";

export default function SharedGoalsPage() {
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [form, setForm] = useState<{
    title: string;
    description: string;
    thrustArea: string;
    uomType: string;
    target: string;
    weightage: number;
  }>({
    title: "",
    description: "",
    thrustArea: THRUST_AREAS[0],
    uomType: "NUMERIC_MIN",
    target: "",
    weightage: 20,
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/manager/team?year=2026")
      .then((r) => r.json())
      .then((d) =>
        setEmployees((d.team ?? []).map((m: { id: string; name: string }) => ({ id: m.id, name: m.name })))
      );
  }, []);

  async function push() {
    const res = await fetch("/api/admin/shared-goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, employeeIds: selected, year: 2026 }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Failed");
      return;
    }
    setMessage(`Pushed to ${data.results?.filter((r: { ok?: boolean }) => r.ok).length ?? 0} employees.`);
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Push Shared Departmental KPI</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3 rounded-xl border bg-white p-4">
          <input
            placeholder="Goal title (read-only for recipients)"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full rounded border px-3 py-2"
          />
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full rounded border px-3 py-2"
          />
          <select
            value={form.thrustArea}
            onChange={(e) => setForm({ ...form, thrustArea: e.target.value })}
            className="w-full rounded border px-3 py-2"
          >
            {THRUST_AREAS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <select
            value={form.uomType}
            onChange={(e) => setForm({ ...form, uomType: e.target.value })}
            className="w-full rounded border px-3 py-2"
          >
            {Object.entries(UOM_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <input
            placeholder="Target"
            value={form.target}
            onChange={(e) => setForm({ ...form, target: e.target.value })}
            className="w-full rounded border px-3 py-2"
          />
          <input
            type="number"
            placeholder="Weightage %"
            value={form.weightage}
            onChange={(e) => setForm({ ...form, weightage: Number(e.target.value) })}
            className="w-full rounded border px-3 py-2"
          />
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="mb-2 text-sm font-medium">Recipients</p>
          {employees.map((e) => (
            <label key={e.id} className="flex items-center gap-2 py-1 text-sm">
              <input
                type="checkbox"
                checked={selected.includes(e.id)}
                onChange={(ev) =>
                  setSelected((s) =>
                    ev.target.checked ? [...s, e.id] : s.filter((id) => id !== e.id)
                  )
                }
              />
              {e.name}
            </label>
          ))}
          <button
            type="button"
            onClick={push}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-white"
          >
            Push shared goal
          </button>
          {message && <p className="mt-2 text-sm text-emerald-700">{message}</p>}
        </div>
      </div>
    </div>
  );
}
