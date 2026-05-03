"use client";

import { useState, useEffect } from "react";
import { Clock, LogOut, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ParkingSlot } from "@/lib/types";
import { formatElapsed, FREE_HOURS, calculateFee } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useParking } from "@/store/parking-store";
import { VehicleIcon } from "@/components/shared/vehicle-icon";
import { CheckoutDialog } from "@/components/parking/checkout-dialog";

interface SlotCardProps {
  slot: ParkingSlot;
  onSelect?: (slot: ParkingSlot) => void;
  lanePosition?: "top" | "bottom";
}

const STATUS_STYLES: Record<
  ParkingSlot["status"],
  {
    border: string;
    bg: string;
    dot: string;
    iconColor: string;
    hoverBorder: string;
  }
> = {
  available: {
    border: "dark:border-white/20 border-zinc-300",
    bg: "dark:bg-white/5 bg-zinc-50",
    dot: "bg-emerald-500",
    iconColor: "dark:text-white/60 text-zinc-400",
    hoverBorder:
      "dark:hover:border-white/40 hover:border-zinc-400 dark:hover:bg-white/10 hover:bg-zinc-100",
  },
  occupied: {
    border: "dark:border-blue-400/60 border-blue-400",
    bg: "dark:bg-blue-400/10 bg-blue-50",
    dot: "bg-blue-500",
    iconColor: "dark:text-blue-300 text-blue-500",
    hoverBorder:
      "dark:hover:border-blue-400 hover:border-blue-500 dark:hover:bg-blue-400/20 hover:bg-blue-100 hover:shadow-blue-500/20",
  },
  reserved: {
    border: "dark:border-amber-400/60 border-amber-400",
    bg: "dark:bg-amber-400/10 bg-amber-50",
    dot: "bg-amber-500",
    iconColor: "dark:text-amber-300 text-amber-600",
    hoverBorder:
      "dark:hover:border-amber-400 hover:border-amber-500 dark:hover:bg-amber-400/20 hover:bg-amber-100 hover:shadow-amber-500/20",
  },
};

export function SlotCard({
  slot,
  onSelect,
  lanePosition = "bottom",
}: SlotCardProps) {
  const {
    exitVehicle,
    state: { appSettings },
  } = useParking();
  const { freeHours, excessRate } = appSettings;
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const style = STATUS_STYLES[slot.status];

  // Live clock for overstay detection
  useEffect(() => {
    if (slot.status !== "occupied") return;
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, [slot.status]);

  const isOverstay =
    slot.status === "occupied" &&
    slot.vehicle &&
    now.getTime() - slot.vehicle.entryTime.getTime() >
      freeHours * 60 * 60 * 1000;

  const overstayMs =
    slot.status === "occupied" && slot.vehicle
      ? Math.max(
          0,
          now.getTime() -
            slot.vehicle.entryTime.getTime() -
            freeHours * 60 * 60 * 1000,
        )
      : 0;
  const overstayHours = overstayMs / (1000 * 60 * 60);
  // Severity: 0 = none, 1 = mild (<1h), 2 = severe (1-2h), 3 = critical (>2h)
  const overstaySeverity =
    overstayHours <= 0 ? 0 : overstayHours < 1 ? 1 : overstayHours < 2 ? 2 : 3;

  const isClickable = slot.status === "available" && Boolean(onSelect);

  return (
    <>
      <Tooltip>
        <TooltipTrigger
          render={<div />}
          role={isClickable ? "button" : undefined}
          tabIndex={isClickable ? 0 : undefined}
          onKeyDown={(e) => {
            if (isClickable && (e.key === "Enter" || e.key === " "))
              onSelect?.(slot);
          }}
          className={cn(
            "group relative flex flex-col rounded-lg border-2 p-2 h-36",
            "cursor-pointer transition-all duration-200",
            style.border,
            style.bg,
            !isOverstay && style.hoverBorder,
            overstaySeverity === 1 &&
              "dark:border-orange-400/80 border-orange-400 dark:bg-orange-400/10 bg-orange-50 dark:hover:border-orange-400 hover:border-orange-500 dark:hover:bg-orange-400/20 hover:bg-orange-100 hover:shadow-orange-500/20",
            overstaySeverity === 2 &&
              "dark:border-orange-500 border-orange-500 dark:bg-orange-500/15 bg-orange-100 dark:hover:border-orange-400 hover:border-orange-500 dark:hover:bg-orange-500/25 hover:bg-orange-200 hover:shadow-orange-500/20",
            overstaySeverity === 3 &&
              "dark:border-amber-500 border-amber-500 dark:bg-amber-500/20 bg-amber-100 dark:hover:border-amber-400 hover:border-amber-500 dark:hover:bg-amber-500/30 hover:bg-amber-200 hover:shadow-amber-500/20",
            "hover:-translate-y-0.5 hover:shadow-lg",
            isClickable && "active:scale-95",
          )}
          onClick={() => isClickable && onSelect?.(slot)}
        >
          {/* Lane-side stripe (painted stall line) */}
          <div
            className={cn(
              "absolute left-0 right-0 h-1 dark:bg-white/10 bg-black/8",
              lanePosition === "bottom"
                ? "bottom-0 rounded-b-md"
                : "top-0 rounded-t-md",
            )}
          />
          {/* Top corner: slot label + overstay badge */}
          <div className="flex items-start justify-between mb-1 gap-0.5">
            {/* Left: slot ID stacked above overstay badge */}
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-[9px] font-bold dark:text-white/40 text-zinc-400 tracking-wider leading-none">
                {slot.zone}-{String(slot.number).padStart(2, "0")}
              </span>
              {isOverstay && (
                <span
                  className={cn(
                    "flex items-center gap-0.5 rounded-sm px-1 py-0.5 text-[7px] font-bold w-fit leading-none",
                    overstaySeverity === 1 &&
                      "bg-orange-400/20 text-orange-700 dark:text-orange-400 animate-pulse",
                    overstaySeverity === 2 &&
                      "bg-orange-500/25 text-orange-800 dark:text-orange-400 animate-pulse",
                    overstaySeverity === 3 &&
                      "bg-amber-500/25 text-amber-800 dark:text-amber-400 animate-[pulse_0.75s_ease-in-out_infinite]",
                  )}
                >
                  <AlertTriangle className="h-2 w-2 shrink-0" />
                  OVERSTAY
                </span>
              )}
            </div>
            {/* Right: status dot */}
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full shrink-0 mt-0.5",
                overstaySeverity === 3
                  ? "bg-amber-500 animate-[pulse_0.75s_ease-in-out_infinite]"
                  : overstaySeverity >= 1
                    ? "bg-orange-400 animate-pulse shadow-sm shadow-orange-400/60"
                    : style.dot,
                slot.status === "occupied" &&
                  !isOverstay &&
                  "animate-pulse shadow-sm shadow-blue-400/60",
              )}
            />
          </div>

          {/* Vehicle icon — side profile */}
          <div
            className={cn(
              "flex flex-1 items-center justify-center transition-transform duration-200 group-hover:scale-110",
              style.iconColor,
            )}
          >
            <VehicleIcon size={slot.size} className="h-10 w-10" />
          </div>

          {/* Status / content */}
          {slot.status === "available" && (
            <p className="text-center text-[9px] font-semibold dark:text-white/30 text-zinc-400">
              {slot.sqm}sqm
            </p>
          )}

          {slot.status === "reserved" && (
            <p className="text-center text-[9px] font-semibold dark:text-amber-400/80 text-amber-600">
              Reserved
            </p>
          )}

          {slot.status === "occupied" && slot.vehicle && (
            <div className="space-y-px overflow-hidden">
              <p className="truncate text-center text-[9px] font-bold dark:text-white/80 text-zinc-800 tracking-wider leading-tight">
                {slot.vehicle.plate}
              </p>
              <div
                className={cn(
                  "flex items-center justify-center gap-0.5 text-[8px] leading-tight",
                  isOverstay
                    ? "dark:text-orange-400/80 text-orange-700"
                    : "dark:text-blue-400/80 text-blue-500",
                )}
              >
                <Clock className="h-2 w-2 shrink-0" />
                <span className="truncate">
                  {formatElapsed(slot.vehicle.entryTime)}
                </span>
              </div>
              <p className="text-center text-[9px] font-bold dark:text-emerald-400 text-emerald-600 leading-tight">
                ₱
                {calculateFee(slot.size, slot.vehicle.entryTime, now, {
                  freeHours,
                  excessRate,
                }).toLocaleString()}
              </p>
              <Button
                size="sm"
                variant="outline"
                className={cn(
                  "mt-px h-5 w-full bg-transparent text-[9px] active:scale-95 transition-all duration-150",
                  isOverstay
                    ? "border-amber-400/40 text-amber-700 dark:text-amber-400 hover:bg-amber-600! hover:text-white! hover:border-amber-600!"
                    : "border-blue-400/40 text-blue-400 hover:bg-blue-500! hover:text-white! hover:border-blue-500!",
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  setCheckoutOpen(true);
                }}
              >
                <LogOut className="mr-0.5 h-2 w-2" />
                Exit
              </Button>
            </div>
          )}
        </TooltipTrigger>

        <TooltipContent side="top" className="text-xs">
          <div className="space-y-1">
            <p className="font-semibold">
              Slot {slot.zone}-{String(slot.number).padStart(2, "0")}
            </p>
            <p>
              Type: {slot.size} · {slot.sqm} sqm
            </p>
            <p>Status: {slot.status}</p>
            {slot.vehicle && (
              <>
                <p>Plate: {slot.vehicle.plate}</p>
                <p>
                  Since:{" "}
                  {slot.vehicle.entryTime.toLocaleTimeString("en-PH", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </>
            )}
          </div>
        </TooltipContent>
      </Tooltip>

      <CheckoutDialog
        slot={slot}
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
      />
    </>
  );
}
