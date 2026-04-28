"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ParkingSquare, Eye, EyeOff, Loader2 } from "lucide-react";
import { signIn } from "@/lib/auth";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      setError("Invalid email or password.");
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden dark:bg-zinc-950 bg-zinc-50">
      {/* Subtle background glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-125 w-125 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/5 blur-3xl" />
      </div>

      <div className="w-full max-w-95 px-4">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-blue-500 to-blue-700 shadow-2xl shadow-blue-900/40 ring-1 ring-blue-400/20">
            <ParkingSquare className="h-8 w-8 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight dark:text-white text-zinc-900">
              Parkify PH
            </h1>
            <p className="mt-1 text-sm dark:text-zinc-500 text-zinc-500">
              Staff portal — sign in to continue
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border dark:border-zinc-800 border-zinc-200 dark:bg-zinc-900/80 bg-white/80 backdrop-blur-sm p-6 shadow-2xl dark:shadow-zinc-950">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-widest dark:text-zinc-400 text-zinc-500">
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@parkify.ph"
                className={cn(
                  "w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all duration-200",
                  "dark:border-zinc-700 border-zinc-200 dark:bg-zinc-800 bg-zinc-50",
                  "dark:text-white text-zinc-900 dark:placeholder:text-zinc-600 placeholder:text-zinc-400",
                  "focus:ring-2 dark:focus:ring-blue-500/40 focus:ring-blue-500/30 dark:focus:border-blue-500/60 focus:border-blue-500/60",
                )}
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-widest dark:text-zinc-400 text-zinc-500">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={cn(
                    "w-full rounded-xl border px-4 py-3 pr-11 text-sm outline-none transition-all duration-200",
                    "dark:border-zinc-700 border-zinc-200 dark:bg-zinc-800 bg-zinc-50",
                    "dark:text-white text-zinc-900 dark:placeholder:text-zinc-600 placeholder:text-zinc-400",
                    "focus:ring-2 dark:focus:ring-blue-500/40 focus:ring-blue-500/30 dark:focus:border-blue-500/60 focus:border-blue-500/60",
                    // Hide browser's built-in password reveal button
                    "[&::-ms-reveal]:hidden [&::-ms-clear]:hidden",
                  )}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 dark:text-zinc-500 text-zinc-400 dark:hover:text-zinc-300 hover:text-zinc-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 px-4 py-3">
                <div className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                <p className="text-xs text-rose-600 dark:text-rose-400">
                  {error}
                </p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 transition-all duration-200 hover:bg-blue-500 hover:-translate-y-0.5 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs dark:text-zinc-600 text-zinc-400">
          Parkify PH · Slot Management System
        </p>
      </div>
    </div>
  );
}
