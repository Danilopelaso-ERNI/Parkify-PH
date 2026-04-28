"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, AlertTriangle, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useParking } from "@/store/parking-store";
import { FREE_HOURS, formatElapsed } from "@/lib/constants";

export function NotificationsPanel() {
  const { state } = useParking();
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [seenCount, setSeenCount] = useState(0);
  const initialised = useRef(false);
  const ref = useRef<HTMLDivElement>(null);

  // Tick every minute
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  // Once slots load for the first time, treat existing overstays as already seen
  // so the badge only lights up for NEW overstays that happen during this session.
  useEffect(() => {
    if (!initialised.current && state.slots.length > 0) {
      initialised.current = true;
      const existing = state.slots.filter(
        (s) =>
          s.status === "occupied" &&
          s.vehicle &&
          new Date().getTime() - s.vehicle.entryTime.getTime() >
            FREE_HOURS * 60 * 60 * 1000,
      ).length;
      setSeenCount(existing);
    }
  }, [state.slots]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const overstaySlots = state.slots.filter(
    (s) =>
      s.status === "occupied" &&
      s.vehicle &&
      now.getTime() - s.vehicle.entryTime.getTime() >
        FREE_HOURS * 60 * 60 * 1000,
  );

  const count = overstaySlots.length;
  const unread = Math.max(0, count - seenCount);

  function handleOpen() {
    setOpen((v) => {
      if (!v) setSeenCount(count); // mark all as seen when opening
      return !v;
    });
  }

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={() => handleOpen()}
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-200",
          "dark:border-white/15 border-black/15 dark:bg-white/10 bg-black/5",
          "shadow-sm backdrop-blur-sm dark:text-white text-slate-700",
          "dark:hover:bg-white/20 hover:bg-black/10 dark:hover:border-white/25 hover:border-black/20",
          "hover:-translate-y-0.5 active:scale-95",
          open && "dark:bg-white/20 bg-black/10",
        )}
      >
        <Bell className="h-4 w-4 dark:text-white/80 text-slate-600" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white shadow-sm ring-2 dark:ring-zinc-900 ring-white">
            {unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-2xl border dark:border-zinc-700 border-zinc-200 dark:bg-zinc-900 bg-white shadow-2xl dark:shadow-zinc-950/60">
          {/* Header */}
          <div className="flex items-center justify-between border-b dark:border-zinc-800 border-zinc-100 px-4 py-3">
            <div>
              <p className="text-sm font-semibold dark:text-white text-zinc-900">
                Notifications
              </p>
              <p className="text-xs dark:text-zinc-500 text-zinc-400">
                {count > 0
                  ? `${count} overstay alert${count > 1 ? "s" : ""}`
                  : "All clear"}
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 dark:text-zinc-500 text-zinc-400 dark:hover:text-zinc-300 hover:text-zinc-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Items */}
          <div className="max-h-80 overflow-y-auto">
            {count === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 dark:text-zinc-600 text-zinc-300">
                <Bell className="h-8 w-8" />
                <p className="text-xs">No alerts right now</p>
              </div>
            ) : (
              overstaySlots.map((slot) => {
                const hrs = Math.floor(
                  (now.getTime() - slot.vehicle!.entryTime.getTime()) /
                    (1000 * 60 * 60),
                );
                const excess = hrs - FREE_HOURS;
                return (
                  <div
                    key={slot.id}
                    className="flex items-start gap-3 border-b dark:border-zinc-800 border-zinc-100 px-4 py-3 last:border-0"
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange-400/15">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold dark:text-white text-zinc-900">
                        {slot.vehicle!.plate}
                        <span className="ml-2 text-xs font-normal dark:text-zinc-400 text-zinc-500">
                          · {slot.id}
                        </span>
                      </p>
                      <p className="text-xs text-orange-500 dark:text-orange-400 font-medium">
                        Parked {formatElapsed(slot.vehicle!.entryTime)} ·{" "}
                        {excess}h over limit
                      </p>
                      <div className="mt-1 flex items-center gap-1 text-[10px] dark:text-zinc-500 text-zinc-400">
                        <Clock className="h-3 w-3" />
                        Entered at{" "}
                        {slot.vehicle!.entryTime.toLocaleTimeString("en-PH", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
