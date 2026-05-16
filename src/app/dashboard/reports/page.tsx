"use client";

export default function ReportsPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Achievement Report</h1>
      <p className="mb-4 text-sm text-slate-600">
        Export planned target vs. actual achievement for all approved goal sheets.
      </p>
      <a
        href="/api/reports/achievement?year=2026&format=csv"
        className="inline-block rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
      >
        Download CSV
      </a>
    </div>
  );
}
