"use client";

import { useCallback, useEffect, useState } from "react";
import { GoalEditor, type EditableGoal } from "@/components/GoalEditor";

type Sheet = {
  id: string;
  status: string;
  goals: EditableGoal[];
};

export function EmployeeGoalsPage() {
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [goals, setGoals] = useState<EditableGoal[]>([]);
  const [goalSettingOpen, setGoalSettingOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/goals/sheet?year=2026");
    const data = await res.json();
    setSheet(data.sheet);
    setGoalSettingOpen(data.goalSettingOpen);
    setGoals(
      data.sheet?.goals?.map((g: EditableGoal & { id: string }) => ({
        id: g.id,
        thrustArea: g.thrustArea,
        title: g.title,
        description: g.description ?? "",
        uomType: g.uomType,
        target: g.target,
        weightage: g.weightage,
        isShared: g.isShared,
        sharedGroupId: g.sharedGroupId,
        isPrimaryOwner: g.isPrimaryOwner,
      })) ?? []
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const editable =
    goalSettingOpen && sheet && ["DRAFT", "RETURNED"].includes(sheet.status);
  const locked = sheet?.status === "APPROVED";
  const submitted = sheet?.status === "SUBMITTED";

  async function save() {
    setMessage("");
    const res = await fetch("/api/goals/sheet", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year: 2026, goals }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error);
      return;
    }
    setMessage("Goals saved.");
    load();
  }

  async function submit() {
    await save();
    const res = await fetch("/api/goals/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year: 2026 }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error);
      return;
    }
    setMessage("Goal sheet submitted for manager approval.");
    load();
  }

  if (loading) return <p className="text-slate-600">Loading…</p>;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Goal Sheet — FY 2026</h1>
          <p className="text-sm text-slate-600">
            Status:{" "}
            <span className="font-medium text-indigo-700">{sheet?.status ?? "DRAFT"}</span>
            {locked && " · Locked after approval"}
          </p>
        </div>
        {editable && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={save}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-white"
            >
              Save draft
            </button>
            <button
              type="button"
              onClick={submit}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Submit for approval
            </button>
          </div>
        )}
      </div>

      {!goalSettingOpen && !locked && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Goal setting window is closed. Use the Demo cycle selector and choose Goal Setting (May).
        </div>
      )}

      {submitted && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          Awaiting manager approval.
        </div>
      )}

      {message && <p className="mb-4 text-sm text-emerald-700">{message}</p>}

      {goals.length === 0 && editable ? (
        <button
          type="button"
          onClick={() =>
            setGoals([
              {
                thrustArea: "Revenue Growth",
                title: "",
                uomType: "NUMERIC_MIN",
                target: "",
                weightage: 100,
              },
            ])
          }
          className="rounded-lg bg-indigo-600 px-4 py-2 text-white"
        >
          Start goal sheet
        </button>
      ) : (
        <GoalEditor goals={goals} onChange={setGoals} readOnly={!editable} lockedFields={locked} />
      )}
    </div>
  );
}
