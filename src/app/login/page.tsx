"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DEMO_USERS } from "@/lib/constants";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(loginEmail: string, loginPassword: string) {
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: loginEmail, password: loginPassword }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Login failed");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-slate-900">AtomQuest Goals</h1>
        <p className="mt-1 text-sm text-slate-600">
          In-House Goal Setting & Tracking Portal
        </p>

        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin(email, password);
          }}
        >
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              required
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              required
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="mt-8 border-t border-slate-200 pt-6">
          <p className="mb-3 text-center text-xs font-medium uppercase tracking-wide text-slate-500">
            Quick demo login
          </p>
          <div className="grid gap-2">
            {(
              [
                ["Employee", DEMO_USERS.employee],
                ["Manager (L1)", DEMO_USERS.manager],
                ["Admin / HR", DEMO_USERS.admin],
              ] as const
            ).map(([label, creds]) => (
              <button
                key={label}
                type="button"
                disabled={loading}
                onClick={() => handleLogin(creds.email, creds.password)}
                className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-800 hover:bg-indigo-100"
              >
                {label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-center text-xs text-slate-500">
            Password for all demo accounts: <strong>demo123</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
