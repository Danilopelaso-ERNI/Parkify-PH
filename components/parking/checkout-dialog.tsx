"use client";

import { useState, useEffect } from "react";
import { LogOut, Clock, Car, MapPin, Receipt, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ParkingSlot } from "@/lib/types";
import {
  calculateFee,
  formatElapsed,
  FREE_HOURS,
  EXCESS_HOURLY_RATE,
  BASE_PRICES,
} from "@/lib/constants";
import { VehicleIcon } from "@/components/shared/vehicle-icon";
import { useParking } from "@/store/parking-store";

interface CheckoutDialogProps {
  slot: ParkingSlot | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CheckoutDialog({
  slot,
  open,
  onOpenChange,
}: CheckoutDialogProps) {
  const { exitVehicle } = useParking();
  const [now, setNow] = useState(new Date());
  const [confirmed, setConfirmed] = useState(false);

  // Live clock to keep duration/fee up to date
  useEffect(() => {
    if (!open) return;
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [open]);

  // Reset confirmed state when dialog opens
  useEffect(() => {
    if (open) setConfirmed(false);
  }, [open]);

  if (!slot || !slot.vehicle) return null;

  const { plate, entryTime } = slot.vehicle;
  const ms = now.getTime() - entryTime.getTime();
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const billedHours = Math.max(1, Math.ceil(ms / (1000 * 60 * 60)));
  const base = BASE_PRICES[slot.size];
  const total = calculateFee(slot.size, entryTime, now);
  const excess = Math.max(0, billedHours - FREE_HOURS);
  const excessFee = excess * EXCESS_HOURLY_RATE;

  function handleConfirm() {
    setConfirmed(true);
    setTimeout(async () => {
      await exitVehicle(slot!.id);
      onOpenChange(false);
    }, 1200);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={!confirmed}
        className="max-w-sm dark:bg-zinc-900 bg-white dark:border-zinc-700 border-zinc-200 p-0 overflow-hidden"
      >
        {confirmed ? (
          // ── Success state ──
          <div className="flex flex-col items-center justify-center gap-3 py-10 px-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 ring-2 ring-emerald-500/30">
              <CheckCircle className="h-7 w-7 text-emerald-500" />
            </div>
            <p className="text-base font-bold dark:text-white text-zinc-900">
              Payment Confirmed
            </p>
            <p className="text-sm dark:text-zinc-400 text-zinc-500">
              Slot {slot.id} is now available
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 border-b dark:border-zinc-800 border-zinc-100 bg-rose-500/8 px-5 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/15 ring-1 ring-rose-500/30">
                <LogOut className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold dark:text-white text-zinc-900">
                  Vehicle Checkout
                </DialogTitle>
                <p className="text-xs dark:text-zinc-400 text-zinc-500">
                  Confirm payment before releasing
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="space-y-4 px-5 py-4">
              {/* Vehicle info */}
              <div className="flex items-center gap-3 rounded-xl dark:bg-zinc-800 bg-zinc-50 border dark:border-zinc-700 border-zinc-200 px-4 py-3">
                <div className="dark:text-zinc-300 text-zinc-600">
                  <VehicleIcon size={slot.size} className="h-8 w-8" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold dark:text-white text-zinc-900 tracking-wider">
                    {plate}
                  </p>
                  <p className="text-xs dark:text-zinc-400 text-zinc-500">
                    {slot.size === "XL"
                      ? "SUV / Van"
                      : slot.size === "L"
                        ? "Sedan"
                        : slot.size === "M"
                          ? "Hatchback"
                          : "Motorcycle"}
                  </p>
                </div>
                <div className="flex items-center gap-1 rounded-lg dark:bg-zinc-700 bg-zinc-200 px-2.5 py-1">
                  <MapPin className="h-3 w-3 dark:text-zinc-300 text-zinc-600" />
                  <span className="text-xs font-bold dark:text-zinc-200 text-zinc-700">
                    {slot.id}
                  </span>
                </div>
              </div>

              {/* Duration */}
              <div className="flex items-center justify-between rounded-xl dark:bg-zinc-800 bg-zinc-50 border dark:border-zinc-700 border-zinc-200 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 dark:text-zinc-400 text-zinc-500" />
                  <span className="text-sm dark:text-zinc-300 text-zinc-600">
                    Duration
                  </span>
                </div>
                <span className="font-mono text-sm font-bold dark:text-white text-zinc-900">
                  {hours > 0 ? `${hours}h ` : ""}
                  {minutes}m
                </span>
              </div>

              {/* Timestamps */}
              <div className="rounded-xl dark:bg-zinc-800 bg-zinc-50 border dark:border-zinc-700 border-zinc-200 overflow-hidden">
                <div className="space-y-0 divide-y dark:divide-zinc-700 divide-zinc-200">
                  <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="dark:text-zinc-400 text-zinc-500">
                      Entry
                    </span>
                    <span className="font-mono text-xs dark:text-zinc-200 text-zinc-700">
                      {entryTime.toLocaleString("en-PH", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="dark:text-zinc-400 text-zinc-500">
                      Exit (now)
                    </span>
                    <span className="font-mono text-xs dark:text-zinc-200 text-zinc-700">
                      {now.toLocaleString("en-PH", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="dark:text-zinc-400 text-zinc-500">
                      Billed hours
                    </span>
                    <span className="dark:text-zinc-200 text-zinc-700 font-medium">
                      {billedHours}h
                      <span className="ml-1 text-[10px] dark:text-zinc-500 text-zinc-400">
                        (rounded up)
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Fee breakdown */}
              <div className="rounded-xl dark:bg-zinc-800 bg-zinc-50 border dark:border-zinc-700 border-zinc-200 overflow-hidden">
                <div className="flex items-center gap-2 border-b dark:border-zinc-700 border-zinc-200 px-4 py-2.5">
                  <Receipt className="h-3.5 w-3.5 dark:text-zinc-400 text-zinc-500" />
                  <span className="text-xs font-semibold uppercase tracking-wider dark:text-zinc-400 text-zinc-500">
                    Fee Breakdown
                  </span>
                </div>
                <div className="space-y-2 px-4 py-3">
                  <div className="flex justify-between text-sm">
                    <span className="dark:text-zinc-300 text-zinc-600">
                      Base rate ({FREE_HOURS}h flat)
                    </span>
                    <span className="dark:text-zinc-200 text-zinc-700 font-medium">
                      ₱{base}
                    </span>
                  </div>
                  {excess > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="dark:text-zinc-300 text-zinc-600">
                        Excess ({excess}h × ₱{EXCESS_HOURLY_RATE})
                      </span>
                      <span className="dark:text-zinc-200 text-zinc-700 font-medium">
                        ₱{excessFee}
                      </span>
                    </div>
                  )}
                  {excess === 0 && (
                    <div className="text-[11px] dark:text-zinc-500 text-zinc-400 italic">
                      Flat rate applies — under {FREE_HOURS}h (billed hours
                      rounded up)
                    </div>
                  )}
                  <div className="border-t dark:border-zinc-700 border-zinc-200 pt-2 flex justify-between">
                    <span className="text-sm font-bold dark:text-white text-zinc-900">
                      Total
                    </span>
                    <span className="text-lg font-bold text-emerald-500">
                      ₱{total}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-2 border-t dark:border-zinc-800 border-zinc-100 px-5 py-4">
              <Button
                variant="outline"
                className="flex-1 dark:border-zinc-700 border-zinc-200 dark:text-zinc-300 text-zinc-600 dark:hover:bg-zinc-800 hover:bg-zinc-100"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-900/30"
                onClick={handleConfirm}
              >
                <CheckCircle className="mr-1.5 h-4 w-4" />
                Confirm ₱{total}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
