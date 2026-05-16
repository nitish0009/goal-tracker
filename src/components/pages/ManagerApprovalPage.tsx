"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { GoalEditor, type EditableGoal } from "@/components/GoalEditor";

export function ManagerApprovalPage() {
  const params = useSearchParams();
  const employeeId = params.get("employeeId");
  const [sheet, setSheet] = useState<{ id: string; status: string } | null>(null);
  const [goals, setGoals] = useState<EditableGoal[]>([]);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    if (!employeeId) return;
    const res = await fetch(`/api/goals/sheet?year=2026&employeeId=${employeeId}`);
    const data = await res.json();
    setSheet(data.sheet);
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
      })) ?? []
    );
  }, [employeeId]);

  useEffect(() => {
    load();
  }, [load]);

  async function approve() {
    if (!sheet) return;
    const res = await fetch("/api/manager/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sheetId: sheet.id, goals }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error);
      return;
    }
    setMessage("Approved and locked.");
    load();
  }

  async function returnForRework() {
    if (!sheet) return;
    const res = await fetch("/api/manager/return", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sheetId: sheet.id, comment: "Please revise per discussion." }),
    });
    if (res.ok) {
      setMessage("Returned to employee for rework.");
      load();
    }
  }

  if (!employeeId) {
    return <p>Select an employee from Team Overview or Approvals list.</p>;
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Review Goal Sheet</h1>
      <p className="mb-6 text-sm text-slate-600">Status: {sheet?.status}</p>
      {message && <p className="mb-4 text-sm text-emerald-700">{message}</p>}
      <GoalEditor goals={goals} onChange={setGoals} readOnly={sheet?.status !== "SUBMITTED"} />
      {sheet?.status === "SUBMITTED" && (
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={approve}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
          >
            Approve & lock
          </button>
          <button
            type="button"
            onClick={returnForRework}
            className="rounded-lg border border-red-300 px-4 py-2 text-red-700 hover:bg-red-50"
          >
            Return for rework
          </button>
        </div>
      )}
    </div>
  );
}
