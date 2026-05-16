"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { UOM_LABELS } from "@/lib/constants";

type Goal = {
  id: string;
  title: string;
  uomType: string;
  target: string;
  actualAchievement: string | null;
  progressStatus: string;
  isShared: boolean;
  isPrimaryOwner: boolean;
  weightage: number;
};

export function CheckInPage({ mode }: { mode: "employee" | "manager" }) {
  const params = useSearchParams();
  const employeeIdParam = params.get("employeeId");
  const [sheet, setSheet] = useState<{ id: string; goals: Goal[] } | null>(null);
  const [quarter, setQuarter] = useState("Q1_CHECKIN");
  const [updates, setUpdates] = useState<Record<string, Partial<Goal>>>({});
  const [managerComment, setManagerComment] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const url =
      mode === "employee"
        ? "/api/goals/sheet?year=2026"
        : `/api/goals/sheet?year=2026&employeeId=${employeeIdParam}`;
    const res = await fetch(url);
    const data = await res.json();
    setSheet(data.sheet);
    const init: Record<string, Partial<Goal>> = {};
    for (const g of data.sheet?.goals ?? []) {
      init[g.id] = {
        actualAchievement: g.actualAchievement ?? "",
        progressStatus: g.progressStatus,
      };
    }
    setUpdates(init);
  }, [mode, employeeIdParam]);

  useEffect(() => {
    load();
  }, [load]);

  async function save(complete: boolean) {
    if (!sheet) return;
    const goalUpdates = sheet.goals.map((g) => ({
      id: g.id,
      actualAchievement: updates[g.id]?.actualAchievement,
      progressStatus: updates[g.id]?.progressStatus ?? g.progressStatus,
      weightage: g.isShared ? g.weightage : undefined,
    }));

    const res = await fetch("/api/checkins", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sheetId: sheet.id,
        quarter,
        goals: mode === "employee" ? goalUpdates : undefined,
        managerComment: mode === "manager" ? managerComment : undefined,
        markEmployeeComplete: mode === "employee" && complete,
        markManagerComplete: mode === "manager" && complete,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error);
      return;
    }
    setMessage("Check-in saved.");
    load();
  }

  if (!sheet) return <p>Loading…</p>;
  if (sheet && mode === "manager" && !employeeIdParam) {
    return <p>Select a team member from Check-ins navigation.</p>;
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">
        {mode === "employee" ? "Quarterly Check-in" : "Manager Check-in"}
      </h1>
      <label className="mb-4 block text-sm">
        Quarter
        <select
          value={quarter}
          onChange={(e) => setQuarter(e.target.value)}
          className="ml-2 rounded border px-2 py-1"
        >
          <option value="Q1_CHECKIN">Q1 (July)</option>
          <option value="Q2_CHECKIN">Q2 (October)</option>
          <option value="Q3_CHECKIN">Q3 (January)</option>
          <option value="Q4_CHECKIN">Q4 (March–April)</option>
        </select>
      </label>
      {message && <p className="mb-4 text-sm text-emerald-700">{message}</p>}

      <div className="space-y-4">
        {sheet.goals.map((g) => (
          <div key={g.id} className="rounded-xl border bg-white p-4 shadow-sm">
            <h3 className="font-medium">{g.title}</h3>
            <p className="text-xs text-slate-500">
              {UOM_LABELS[g.uomType]} · Target: {g.target}
            </p>
            {mode === "employee" && (
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <label className="text-sm">
                  Actual
                  <input
                    disabled={g.isShared && !g.isPrimaryOwner}
                    value={updates[g.id]?.actualAchievement ?? ""}
                    onChange={(e) =>
                      setUpdates((u) => ({
                        ...u,
                        [g.id]: { ...u[g.id], actualAchievement: e.target.value },
                      }))
                    }
                    className="mt-1 w-full rounded border px-2 py-1 disabled:bg-slate-100"
                  />
                </label>
                <label className="text-sm">
                  Status
                  <select
                    value={updates[g.id]?.progressStatus ?? g.progressStatus}
                    onChange={(e) =>
                      setUpdates((u) => ({
                        ...u,
                        [g.id]: { ...u[g.id], progressStatus: e.target.value },
                      }))
                    }
                    className="mt-1 w-full rounded border px-2 py-1"
                  >
                    <option value="NOT_STARTED">Not Started</option>
                    <option value="ON_TRACK">On Track</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </label>
              </div>
            )}
            {mode === "manager" && (
              <p className="mt-2 text-sm">
                Planned: {g.target} · Actual: {g.actualAchievement ?? "—"} · Status:{" "}
                {g.progressStatus}
              </p>
            )}
          </div>
        ))}
      </div>

      {mode === "manager" && (
        <label className="mt-4 block text-sm">
          Check-in comment
          <textarea
            value={managerComment}
            onChange={(e) => setManagerComment(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>
      )}

      <button
        type="button"
        onClick={() => save(true)}
        className="mt-6 rounded-lg bg-indigo-600 px-4 py-2 text-white"
      >
        Save & mark complete
      </button>
    </div>
  );
}
