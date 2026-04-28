"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { SlotCard } from "./slot-card";
import { useParking } from "@/store/parking-store";
import { VehicleIcon } from "@/components/shared/vehicle-icon";
import type { ParkingSlot, SlotZone } from "@/lib/types";

const ZONE_COLUMNS: Record<SlotZone, number> = {
  A: 5,
  B: 5,
  C: 6,
  D: 10,
};

interface SlotGridProps {
  onSlotSelect?: (slot: ParkingSlot) => void;
}

function DrivingLane() {
  return (
    <div className="relative flex items-center gap-2 my-2 py-1">
      <div className="flex-1 border-t-2 border-dashed dark:border-yellow-400/35 border-yellow-600/30" />
      <div className="flex items-center gap-2 rounded-full dark:bg-yellow-400/8 bg-yellow-400/10 border dark:border-yellow-400/20 border-yellow-500/25 px-3 py-0.5">
        <span className="text-[9px] font-bold tracking-[0.2em] uppercase dark:text-yellow-400/60 text-yellow-700/70">
          ← LANE →
        </span>
      </div>
      <div className="flex-1 border-t-2 border-dashed dark:border-yellow-400/35 border-yellow-600/30" />
    </div>
  );
}

export function SlotGrid({ onSlotSelect }: SlotGridProps) {
  const { state } = useParking();
  const zoneConfigs = state.zoneConfigs;

  return (
    <Tabs defaultValue="A" className="w-full">
      <TabsList className="h-auto flex-wrap gap-1.5 dark:bg-white/8 bg-zinc-100 p-1.5 rounded-2xl border dark:border-white/10 border-zinc-200">
        {zoneConfigs.map((cfg) => {
          const zoneSlots = state.slots.filter((s) => s.zone === cfg.zone);
          const availableCount = zoneSlots.filter(
            (s) => s.status === "available",
          ).length;
          return (
            <TabsTrigger
              key={cfg.zone}
              value={cfg.zone}
              className="gap-1.5 text-xs dark:text-white/50 text-slate-500 rounded-xl px-3 py-1.5 transition-all duration-200 dark:data-[state=active]:bg-blue-500 data-[state=active]:bg-blue-600 data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/30 dark:data-[state=active]:text-white data-[state=active]:text-white data-[state=active]:font-semibold dark:hover:bg-white/10 hover:bg-black/5 dark:hover:text-white/80 hover:text-slate-900"
            >
              <VehicleIcon size={cfg.size} className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Zone {cfg.zone} –</span>
              <span>{cfg.shortLabel}</span>
              <Badge
                variant="secondary"
                className="ml-0.5 bg-emerald-100 px-1.5 text-[10px] text-emerald-700 font-bold"
              >
                {availableCount}
              </Badge>
            </TabsTrigger>
          );
        })}
      </TabsList>

      {zoneConfigs.map((cfg) => {
        const zoneSlots = state.slots.filter((s) => s.zone === cfg.zone);
        const cols = ZONE_COLUMNS[cfg.zone as SlotZone];
        const occupied = zoneSlots.filter(
          (s) => s.status === "occupied",
        ).length;
        const reserved = zoneSlots.filter(
          (s) => s.status === "reserved",
        ).length;
        const available = zoneSlots.filter(
          (s) => s.status === "available",
        ).length;

        // Split into rows, then pair rows together with a driving lane between
        const rows: ParkingSlot[][] = [];
        for (let i = 0; i < zoneSlots.length; i += cols) {
          rows.push(zoneSlots.slice(i, i + cols));
        }
        const rowPairs: Array<[ParkingSlot[], ParkingSlot[] | null]> = [];
        for (let i = 0; i < rows.length; i += 2) {
          rowPairs.push([rows[i], rows[i + 1] ?? null]);
        }

        return (
          <TabsContent key={cfg.zone} value={cfg.zone} className="mt-3">
            <div className="rounded-2xl overflow-hidden shadow-xl border dark:border-zinc-700/50 border-zinc-200">
              {/* Zone info header */}
              <div className="flex flex-wrap items-center justify-between gap-2 dark:bg-zinc-800 bg-zinc-100 border-b dark:border-zinc-700/80 border-zinc-200 px-5 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg dark:bg-zinc-700 bg-zinc-200 border dark:border-zinc-600 border-zinc-300">
                    <VehicleIcon
                      size={cfg.size}
                      className="h-4 w-4 dark:text-zinc-300 text-zinc-600"
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold dark:text-white text-zinc-900">
                      {cfg.label}
                    </h3>
                    <p className="text-[11px] dark:text-zinc-400 text-zinc-500">
                      ₱{cfg.basePrice} base · {cfg.sqm} sqm per slot
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1.5 rounded-full dark:bg-emerald-400/10 bg-emerald-50 border dark:border-emerald-400/30 border-emerald-300 px-2.5 py-1 dark:text-emerald-400 text-emerald-700 font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {available} free
                  </span>
                  <span className="flex items-center gap-1.5 rounded-full dark:bg-blue-400/10 bg-blue-50 border dark:border-blue-400/30 border-blue-300 px-2.5 py-1 dark:text-blue-400 text-blue-700 font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                    {occupied} occupied
                  </span>
                  {reserved > 0 && (
                    <span className="flex items-center gap-1.5 rounded-full dark:bg-amber-400/10 bg-amber-50 border dark:border-amber-400/30 border-amber-300 px-2.5 py-1 dark:text-amber-400 text-amber-700 font-semibold">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      {reserved} reserved
                    </span>
                  )}
                </div>
              </div>

              {/* Entry indicator */}
              <div className="flex items-center gap-2 dark:bg-zinc-800/60 bg-zinc-200/60 border-b dark:border-zinc-700/40 border-zinc-300/60 px-5 py-1.5">
                <div className="h-px flex-1 dark:bg-zinc-600/60 bg-zinc-300" />
                <span className="text-[9px] font-bold tracking-[0.2em] uppercase dark:text-zinc-400 text-zinc-500 px-2">
                  ↓ ENTRY
                </span>
                <div className="h-px flex-1 dark:bg-zinc-600/60 bg-zinc-300" />
              </div>

              {/* Parking lot surface */}
              <div
                className="dark:bg-zinc-900 bg-zinc-50 px-4 pb-4 pt-3"
                style={{
                  backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.06) 1px, transparent 0)`,
                  backgroundSize: "24px 24px",
                }}
              >
                <ScrollArea className="max-h-95 w-full overflow-auto">
                  <div className="space-y-0 pb-1 pr-1">
                    {rowPairs.map(([topRow, bottomRow], pairIdx) => (
                      <div key={pairIdx} className={pairIdx > 0 ? "mt-4" : ""}>
                        {/* Top bank — curb side at top */}
                        <div
                          className="grid gap-1.5"
                          style={{
                            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                          }}
                        >
                          {topRow.map((slot) => (
                            <SlotCard
                              key={slot.id}
                              slot={slot}
                              onSelect={onSlotSelect}
                              lanePosition="bottom"
                            />
                          ))}
                        </div>

                        {/* Driving lane */}
                        {bottomRow && <DrivingLane />}

                        {/* Bottom bank — curb side at bottom */}
                        {bottomRow && (
                          <div
                            className="grid gap-1.5"
                            style={{
                              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                            }}
                          >
                            {bottomRow.map((slot) => (
                              <SlotCard
                                key={slot.id}
                                slot={slot}
                                onSelect={onSlotSelect}
                                lanePosition="top"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
