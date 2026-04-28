"use client";

import { useEffect, useState } from "react";
import {
  Car,
  CheckCircle2,
  ParkingCircle,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { useParking } from "@/store/parking-store";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { calculateFee } from "@/lib/constants";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  gradient: string;
  iconGradient: string;
  valueColor: string;
  borderColor: string;
  glowColor: string;
}

function StatCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl border dark:border-white/10 border-black/8 dark:bg-white/5 bg-black/5 backdrop-blur-md p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Skeleton className="h-2.5 w-16" />
          <Skeleton className="h-9 w-12" />
          <Skeleton className="h-2.5 w-20" />
        </div>
        <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  gradient,
  iconGradient,
  valueColor,
  borderColor,
  glowColor,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border p-5",
        "dark:bg-white/8 bg-white/70 backdrop-blur-md shadow-lg",
        "transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:hover:bg-white/12 hover:bg-white/90",
        borderColor,
        glowColor,
      )}
    >
      {/* Inner colored glow blob */}
      <div
        className={cn(
          "absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl opacity-30 transition-all duration-300 group-hover:opacity-50 group-hover:scale-110",
          gradient,
        )}
      />
      {/* Glass shimmer on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-linear-to-br from-white/10 to-transparent pointer-events-none rounded-2xl" />

      <div className="relative flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-widest dark:text-white/50 text-slate-500">
            {label}
          </p>
          <p
            className={cn(
              "text-3xl font-extrabold tracking-tight tabular-nums",
              valueColor,
            )}
          >
            {value}
          </p>
          {sub && (
            <p className="text-xs font-medium dark:text-white/35 text-slate-400">
              {sub}
            </p>
          )}
        </div>
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-md",
            "transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3",
            iconGradient,
          )}
        >
          <Icon className="h-5 w-5 text-white drop-shadow" />
        </div>
      </div>
    </div>
  );
}

export function StatsOverview() {
  const { state } = useParking();
  const { slots, transactions, appSettings } = state;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 600);
    return () => clearTimeout(t);
  }, []);

  const total = slots.length;
  const available = slots.filter((s) => s.status === "available").length;
  const occupied = slots.filter((s) => s.status === "occupied").length;

  const revenueToday = transactions
    .filter((t) => t.status === "completed" && t.amount)
    .reduce((sum, t) => sum + (t.amount ?? 0), 0);

  const activeProjected = transactions
    .filter((t) => t.status === "active")
    .reduce(
      (sum, t) =>
        sum +
        calculateFee(t.size, t.entryTime, new Date(), {
          freeHours: appSettings.freeHours,
          excessRate: appSettings.excessRate,
        }),
      0,
    );

  const completedCount = transactions.filter(
    (t) => t.status === "completed",
  ).length;

  if (!mounted) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <StatCard
        label="Total Slots"
        value={total}
        sub="across 4 zones"
        icon={Car}
        gradient="bg-white/20"
        iconGradient="bg-linear-to-br from-slate-400 to-slate-600"
        valueColor="dark:text-white text-slate-900"
        borderColor="dark:border-white/15 border-black/10"
        glowColor="hover:shadow-white/10"
      />
      <StatCard
        label="Available"
        value={available}
        sub={`${Math.round((available / total) * 100)}% free`}
        icon={CheckCircle2}
        gradient="bg-emerald-400/20"
        iconGradient="bg-linear-to-br from-emerald-400 to-teal-500"
        valueColor="dark:text-emerald-300 text-emerald-600"
        borderColor="dark:border-emerald-400/30 border-emerald-400/25"
        glowColor="hover:shadow-emerald-400/20"
      />
      <StatCard
        label="Occupied"
        value={occupied}
        sub={`${Math.round((occupied / total) * 100)}% full`}
        icon={ParkingCircle}
        gradient="bg-blue-400/20"
        iconGradient="bg-linear-to-br from-blue-400 to-blue-600"
        valueColor="dark:text-blue-300 text-blue-600"
        borderColor="dark:border-blue-400/30 border-blue-400/25"
        glowColor="hover:shadow-blue-400/20"
      />

      <StatCard
        label="Revenue Today"
        value={`₱${revenueToday.toLocaleString()}`}
        sub={`${completedCount} completed${activeProjected > 0 ? ` · +₱${activeProjected.toLocaleString()} active` : ""}`}
        icon={TrendingUp}
        gradient="bg-blue-400/20"
        iconGradient="bg-linear-to-br from-blue-500 to-indigo-600"
        valueColor="dark:text-blue-300 text-blue-600"
        borderColor="dark:border-blue-400/30 border-blue-400/25"
        glowColor="hover:shadow-blue-400/20"
      />
    </div>
  );
}
