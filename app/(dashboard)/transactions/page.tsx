import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";
import { TransactionsTable } from "@/components/parking/transactions-table";
import { StatsOverview } from "@/components/parking/stats-overview";

export const metadata: Metadata = {
  title: "Transactions – Parkify PH",
};

export default function TransactionsPage() {
  return (
    <>
      <AppHeader
        title="Transactions"
        description="Entry / exit log with real-time fee calculation"
      />

      <div className="space-y-6 p-6">
        <StatsOverview />

        <div className="flex items-center gap-3">
          <p className="text-xs font-semibold uppercase tracking-widest dark:text-zinc-400 text-slate-500">
            Transaction Log
          </p>
          <div className="h-px flex-1 dark:bg-zinc-200/10 bg-slate-200" />
        </div>

        <TransactionsTable />
      </div>
    </>
  );
}
