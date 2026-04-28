"use client";

import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { NotificationsPanel } from "@/components/layout/notifications-panel";

interface AppHeaderProps {
  title: string;
  description?: string;
}

export function AppHeader({ title, description }: AppHeaderProps) {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b dark:border-zinc-800 border-zinc-200 dark:bg-zinc-900 bg-white px-6 py-3.5 shadow-sm">
      <div>
        <h1 className="text-xl font-bold dark:text-white text-slate-900 tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-0.5 text-sm dark:text-white/50 text-slate-500">
            {description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Live clock */}
        {time ? (
          <div className="hidden rounded-2xl border dark:border-white/10 border-black/8 dark:bg-white/8 bg-black/5 px-3.5 py-2 text-right sm:block shadow-sm backdrop-blur-sm">
            <p className="font-mono text-sm font-bold dark:text-white text-slate-900 tracking-tight">
              {time.toLocaleTimeString("en-PH", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </p>
            <p className="text-[10px] font-medium dark:text-white/40 text-slate-500">
              {time.toLocaleDateString("en-PH", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        ) : (
          <div className="hidden h-13 w-32 animate-pulse rounded-2xl dark:bg-white/10 bg-black/8 sm:block" />
        )}

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <NotificationsPanel />
      </div>
    </header>
  );
}
