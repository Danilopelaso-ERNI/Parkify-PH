"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useParking } from "@/store/parking-store";
import { calculateFee, formatElapsed } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { VehicleIcon } from "@/components/shared/vehicle-icon";
import {
  Search,
  X,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";

type FilterStatus = "all" | "active" | "completed";
type SortKey = "entryTime" | "duration" | "fee";
type SortDir = "asc" | "desc";

export function TransactionsTable() {
  const { state } = useParking();
  const { appSettings } = state;
  const rateOverrides = {
    freeHours: appSettings.freeHours,
    excessRate: appSettings.excessRate,
  };
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [visibleCount, setVisibleCount] = useState(50);
  const [sortKey, setSortKey] = useState<SortKey>("entryTime");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  // Reset pagination when filter, search or sort changes
  useEffect(() => {
    setVisibleCount(50);
  }, [filter, search, sortKey, sortDir]);

  const query = search.trim().toUpperCase();
  const filtered = [...state.transactions]
    .filter((t) => filter === "all" || t.status === filter)
    .filter(
      (t) =>
        !query ||
        t.plate.toUpperCase().includes(query) ||
        t.slotId.toUpperCase().includes(query),
    )
    .sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "entryTime")
        return dir * (a.entryTime.getTime() - b.entryTime.getTime());
      if (sortKey === "fee") {
        const fa =
          a.status === "active"
            ? calculateFee(a.size, a.entryTime, now, rateOverrides)
            : (a.amount ?? 0);
        const fb =
          b.status === "active"
            ? calculateFee(b.size, b.entryTime, now, rateOverrides)
            : (b.amount ?? 0);
        return dir * (fa - fb);
      }
      // duration
      const da = (a.exitTime ?? now).getTime() - a.entryTime.getTime();
      const db = (b.exitTime ?? now).getTime() - b.entryTime.getTime();
      return dir * (da - db);
    });

  const activeCount = state.transactions.filter(
    (t) => t.status === "active",
  ).length;
  const completedCount = state.transactions.filter(
    (t) => t.status === "completed",
  ).length;

  return (
    <Card className="overflow-hidden rounded-2xl border-slate-200 dark:border-white/10 shadow-sm dark:bg-white/5 dark:backdrop-blur-md">
      <CardHeader className="border-b border-slate-100 dark:border-white/10 bg-white dark:bg-transparent pb-3 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base font-bold text-slate-800 dark:text-white">
            Transaction Log
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-white/30 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search plate or slot…"
                className="h-8 w-44 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 pl-8 pr-7 text-xs text-slate-700 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/25 outline-none focus:border-blue-400 dark:focus:border-blue-500/50 transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-white/30 dark:hover:text-white/60"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <div className="flex gap-1 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-1">
              {(["all", "active", "completed"] as FilterStatus[]).map((f) => (
                <Button
                  key={f}
                  size="sm"
                  variant="ghost"
                  className={cn(
                    "h-7 px-3 text-xs capitalize transition-all duration-150",
                    filter === f
                      ? "rounded-lg bg-white dark:bg-white/15 shadow-sm font-semibold text-slate-800 dark:text-white hover:bg-white dark:hover:bg-white/15"
                      : "text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white/70 hover:bg-white/60 dark:hover:bg-white/10",
                  )}
                  onClick={() => setFilter(f)}
                >
                  {f}{" "}
                  {f === "active" && activeCount > 0 && (
                    <span className="ml-1.5 rounded-full bg-blue-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
                      {activeCount}
                    </span>
                  )}
                  {f === "completed" && completedCount > 0 && (
                    <span className="ml-1.5 rounded-full bg-slate-200 dark:bg-white/15 px-1.5 py-0.5 text-[9px] font-bold text-slate-600 dark:text-white/70">
                      {completedCount}
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-0 bg-slate-50/80 dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/5">
              <TableHead className="pl-6 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-white/30">
                ID
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-white/30">
                Plate
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-white/30">
                Slot
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-white/30">
                Type
              </TableHead>
              {(
                [
                  { key: "entryTime" as SortKey, label: "Entry" },
                  { key: "duration" as SortKey, label: "Duration" },
                  { key: "fee" as SortKey, label: "Fee" },
                ] as { key: SortKey; label: string }[]
              ).map(({ key, label }) => {
                const active = sortKey === key;
                const Icon = active
                  ? sortDir === "asc"
                    ? ChevronUp
                    : ChevronDown
                  : ChevronsUpDown;
                return (
                  <TableHead
                    key={key}
                    className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-white/30"
                  >
                    <button
                      onClick={() => toggleSort(key)}
                      className={cn(
                        "flex items-center gap-1 transition-colors hover:text-slate-700 dark:hover:text-white/70",
                        active && "text-blue-600 dark:text-blue-400",
                      )}
                    >
                      {label}
                      <Icon className="h-3 w-3" />
                    </button>
                  </TableHead>
                );
              })}
              <TableHead className="pr-6 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-white/30">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!mounted ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow
                  key={i}
                  className="border-slate-100 dark:border-white/5"
                >
                  <TableCell className="pl-6">
                    <Skeleton className="h-3 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-3 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-12 rounded-lg" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-3 w-10" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-3 w-14" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-3 w-12" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-3 w-10" />
                  </TableCell>
                  <TableCell className="pr-6">
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-16 text-center text-sm text-slate-400 dark:text-white/30"
                >
                  No transactions found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.slice(0, visibleCount).map((txn) => {
                const fee =
                  txn.status === "active"
                    ? calculateFee(txn.size, txn.entryTime, now, rateOverrides)
                    : (txn.amount ?? 0);
                const duration =
                  txn.status === "active"
                    ? formatElapsed(txn.entryTime, now)
                    : formatElapsed(txn.entryTime, txn.exitTime);

                return (
                  <TableRow
                    key={txn.id}
                    className="border-slate-100 dark:border-white/5 text-sm transition-all duration-150 hover:bg-slate-50/80 dark:hover:bg-white/5 group"
                  >
                    <TableCell className="pl-6 font-mono text-xs text-slate-400 dark:text-white/30">
                      {txn.id}
                    </TableCell>
                    <TableCell className="font-mono text-sm font-bold tracking-wider text-slate-800 dark:text-white">
                      {txn.plate}
                    </TableCell>
                    <TableCell>
                      <span className="rounded-lg border border-blue-100 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 font-mono text-xs font-semibold text-blue-700 dark:text-blue-300 transition-colors group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20">
                        {txn.slotId}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5">
                        <VehicleIcon
                          size={txn.size}
                          className="h-4 w-4 text-slate-500 dark:text-white/40"
                        />
                        <span className="text-xs font-medium text-slate-600 dark:text-white/60">
                          {txn.size}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-medium text-slate-500 dark:text-white/40">
                      {txn.entryTime.toLocaleTimeString("en-PH", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-slate-600 dark:text-white/50">
                      {duration}
                    </TableCell>
                    <TableCell className="text-sm font-bold text-slate-900 dark:text-white">
                      ₱{fee.toLocaleString()}
                      {txn.status === "active" && (
                        <span className="ml-1 text-[10px] font-normal text-slate-400 dark:text-white/40">
                          est.
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="pr-6">
                      {txn.status === "active" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold text-blue-700 dark:text-blue-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-500 dark:text-white/40">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                          Done
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        {filtered.length > visibleCount && (
          <div className="border-t border-slate-100 dark:border-white/5 p-4 text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVisibleCount((c) => c + 50)}
              className="h-8 px-6 text-xs text-slate-500 dark:text-white/40"
            >
              Show {Math.min(filtered.length - visibleCount, 50)} more
              <span className="ml-1.5 text-slate-400 dark:text-white/25">
                ({filtered.length - visibleCount} remaining)
              </span>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
