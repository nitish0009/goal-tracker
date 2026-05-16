"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ManagerApprovalPage } from "@/components/pages/ManagerApprovalPage";
import { useSearchParams } from "next/navigation";

export default function ApprovalsPage() {
  const params = useSearchParams();
  const hasEmployee = params.get("employeeId");

  const [pending, setPending] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (hasEmployee) return;
    fetch("/api/manager/team?year=2026")
      .then((r) => r.json())
      .then((d) => {
        const list = (d.team ?? [])
          .filter((m: { goalSheets: { status: string }[] }) => m.goalSheets[0]?.status === "SUBMITTED")
          .map((m: { id: string; name: string }) => ({ id: m.id, name: m.name }));
        setPending(list);
      });
  }, [hasEmployee]);

  if (hasEmployee) return <ManagerApprovalPage />;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Pending Approvals</h1>
      {pending.length === 0 ? (
        <p className="text-slate-600">No submissions awaiting approval.</p>
      ) : (
        <ul className="space-y-2">
          {pending.map((p) => (
            <li key={p.id}>
              <Link
                href={`/dashboard/approvals?employeeId=${p.id}`}
                className="text-indigo-600 hover:underline"
              >
                Review {p.name}&apos;s goal sheet →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
