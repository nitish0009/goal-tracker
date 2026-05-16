"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckInPage } from "@/components/pages/CheckInPage";
import { useSearchParams } from "next/navigation";

export default function ManagerCheckInsPage() {
  const params = useSearchParams();
  const employeeId = params.get("employeeId");

  const [team, setTeam] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (employeeId) return;
    fetch("/api/manager/team?year=2026")
      .then((r) => r.json())
      .then((d) =>
        setTeam((d.team ?? []).map((m: { id: string; name: string }) => ({ id: m.id, name: m.name })))
      );
  }, [employeeId]);

  if (employeeId) return <CheckInPage mode="manager" />;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Team Check-ins</h1>
      <ul className="space-y-2">
        {team.map((m) => (
          <li key={m.id}>
            <Link
              href={`/dashboard/check-ins?employeeId=${m.id}`}
              className="text-indigo-600 hover:underline"
            >
              Check-in with {m.name} →
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
