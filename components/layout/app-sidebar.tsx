"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Car,
  Receipt,
  CircleDot,
  ParkingSquare,
  LogOut,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useParking } from "@/store/parking-store";
import { Progress } from "@/components/ui/progress";
import { signOut } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/entry", label: "Vehicle Entry", icon: Car },
  { href: "/transactions", label: "Transactions", icon: Receipt },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { state } = useParking();

  const total = state.slots.length;
  const available = state.slots.filter((s) => s.status === "available").length;
  const occupancyPct =
    total > 0 ? Math.round(((total - available) / total) * 100) : 0;

  async function handleSignOut() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r dark:border-zinc-800 border-zinc-200 dark:bg-zinc-900 bg-white">
      {/* Brand */}
      <div className="flex items-center gap-3 border-b dark:border-zinc-800 border-zinc-200 px-5 py-4.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-900/40">
          <ParkingSquare className="h-4.5 w-4.5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold tracking-wide dark:text-white text-slate-900">
            Parkify PH
          </p>
          <p className="text-[10px] dark:text-zinc-500 text-slate-400">
            Slot Management System
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest dark:text-white/30 text-slate-400">
          Menu
        </p>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-linear-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-900/40"
                  : "dark:text-zinc-400 text-zinc-600 dark:hover:bg-zinc-800 hover:bg-zinc-100 dark:hover:text-zinc-100 hover:text-zinc-900 hover:translate-x-0.5",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  isActive ? "text-white" : "group-hover:scale-110",
                )}
              />
              {label}
              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/70 shadow-sm shadow-white/50" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Live occupancy widget */}
      <div className="border-t dark:border-zinc-800 border-zinc-200 p-4 space-y-3">
        {/* Logout */}
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 dark:text-zinc-500 text-zinc-400 dark:hover:bg-white/8 hover:bg-zinc-100 dark:hover:text-white hover:text-zinc-700 group border dark:border-zinc-800 border-zinc-200"
        >
          <LogOut className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
          Sign out
        </button>
        <div className="rounded-2xl dark:bg-zinc-800 bg-zinc-100 p-4 ring-1 dark:ring-zinc-700 ring-zinc-200">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[11px] font-semibold dark:text-white/40 text-slate-500">
                Live Status
              </span>
            </div>
            <CircleDot className="h-3 w-3 dark:text-white/20 text-slate-400" />
          </div>

          <p className="text-2xl font-bold dark:text-white text-slate-900 tabular-nums">
            {available}
            <span className="text-sm font-normal dark:text-white/30 text-slate-400">
              {" "}
              / {total}
            </span>
          </p>
          <p className="mb-3 text-[11px] dark:text-white/30 text-slate-400">
            slots available
          </p>

          <Progress
            value={occupancyPct}
            className="h-1.5 dark:bg-white/10 bg-black/10 [&>div]:bg-linear-to-r [&>div]:from-blue-500 [&>div]:to-blue-400 [&>div]:rounded-full"
          />
          <p className="mt-1.5 text-[10px] dark:text-white/25 text-slate-400">
            {occupancyPct}% occupied
          </p>
        </div>
      </div>
    </aside>
  );
}
