import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";
import { StatsOverview } from "@/components/parking/stats-overview";
import { DashboardSlotGrid } from "@/components/parking/dashboard-slot-grid";

export const metadata: Metadata = {
  title: "Dashboard – Parkify PH",
};

export default function DashboardPage() {
  return (
    <>
      <AppHeader
        title="Parking Dashboard"
        description="Real-time slot availability and management"
      />

      <div className="space-y-6 p-6">
        {/* Stats overview */}
        <StatsOverview />

        {/* Zone divider */}
        <div className="flex items-center gap-3">
          <p className="text-xs font-bold uppercase tracking-widest dark:text-white/40 text-slate-400">
            Live Slot Grid
          </p>
          <div className="h-px flex-1 dark:bg-white/10 bg-slate-200" />
        </div>

        {/* Slot grid by zone — clicking an available slot navigates to entry with it pre-selected */}
        <DashboardSlotGrid />
      </div>
    </>
  );
}
