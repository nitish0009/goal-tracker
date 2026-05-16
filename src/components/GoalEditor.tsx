"use client";

import { THRUST_AREAS, UOM_LABELS } from "@/lib/constants";
import { MAX_GOALS, MIN_GOAL_WEIGHT, REQUIRED_TOTAL_WEIGHT } from "@/lib/goals";

export type EditableGoal = {
  id?: string;
  thrustArea: string;
  title: string;
  description?: string;
  uomType: string;
  target: string;
  weightage: number;
  isShared?: boolean;
  sharedGroupId?: string | null;
  isPrimaryOwner?: boolean;
};

type Props = {
  goals: EditableGoal[];
  onChange: (goals: EditableGoal[]) => void;
  readOnly?: boolean;
  sharedWeightOnly?: boolean;
  lockedFields?: boolean;
};

const emptyGoal = (): EditableGoal => ({
  thrustArea: THRUST_AREAS[0],
  title: "",
  description: "",
  uomType: "NUMERIC_MIN",
  target: "",
  weightage: MIN_GOAL_WEIGHT,
});

export function GoalEditor({
  goals,
  onChange,
  readOnly = false,
  sharedWeightOnly = false,
  lockedFields = false,
}: Props) {
  const total = goals.reduce((s, g) => s + (Number(g.weightage) || 0), 0);
  const totalOk = Math.abs(total - REQUIRED_TOTAL_WEIGHT) < 0.01;

  function update(i: number, patch: Partial<EditableGoal>) {
    onChange(goals.map((g, idx) => (idx === i ? { ...g, ...patch } : g)));
  }

  function remove(i: number) {
    onChange(goals.filter((_, idx) => idx !== i));
  }

  function add() {
    if (goals.length >= MAX_GOALS) return;
    onChange([...goals, emptyGoal()]);
  }

  return (
    <div className="space-y-4">
      {goals.map((g, i) => (
        <div
          key={g.id ?? i}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Goal {i + 1}</span>
            {g.isShared && (
              <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                Shared KPI {g.isPrimaryOwner ? "(Owner)" : ""}
              </span>
            )}
            {!readOnly && !g.isShared && goals.length > 1 && (
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-sm text-red-600 hover:underline"
              >
                Remove
              </button>
            )}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block text-sm">
              Thrust Area
              <select
                disabled={readOnly || lockedFields || g.isShared}
                value={g.thrustArea}
                onChange={(e) => update(i, { thrustArea: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-100"
              >
                {THRUST_AREAS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Unit of Measurement
              <select
                disabled={readOnly || lockedFields || g.isShared}
                value={g.uomType}
                onChange={(e) => update(i, { uomType: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-100"
              >
                {Object.entries(UOM_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm md:col-span-2">
              Goal Title
              <input
                disabled={readOnly || lockedFields || g.isShared}
                value={g.title}
                onChange={(e) => update(i, { title: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-100"
              />
            </label>
            <label className="block text-sm md:col-span-2">
              Description
              <textarea
                disabled={readOnly || lockedFields || g.isShared}
                value={g.description ?? ""}
                onChange={(e) => update(i, { description: e.target.value })}
                rows={2}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-100"
              />
            </label>
            <label className="block text-sm">
              Target
              <input
                disabled={readOnly || lockedFields || g.isShared}
                value={g.target}
                onChange={(e) => update(i, { target: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-100"
              />
            </label>
            <label className="block text-sm">
              Weightage (%)
              <input
                type="number"
                min={MIN_GOAL_WEIGHT}
                max={100}
                disabled={readOnly || (lockedFields && !g.isShared && !sharedWeightOnly)}
                value={g.weightage}
                onChange={(e) => update(i, { weightage: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-100"
              />
            </label>
          </div>
        </div>
      ))}

      {!readOnly && goals.length < MAX_GOALS && !sharedWeightOnly && (
        <button
          type="button"
          onClick={add}
          className="rounded-lg border-2 border-dashed border-indigo-300 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
        >
          + Add Goal
        </button>
      )}

      <p className={`text-sm font-medium ${totalOk ? "text-emerald-700" : "text-red-600"}`}>
        Total weightage: {total}% / {REQUIRED_TOTAL_WEIGHT}%
      </p>
    </div>
  );
}
