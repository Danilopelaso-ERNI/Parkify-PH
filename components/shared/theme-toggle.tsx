"use client";

import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/store/theme-store";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className={cn(
        "relative h-9 w-9 rounded-xl transition-all duration-200 active:scale-95 hover:-translate-y-0.5 backdrop-blur-sm",
        "dark:border-white/15 dark:bg-white/10 dark:hover:bg-white/20 dark:hover:border-white/25 dark:text-white",
        "border-black/15 bg-black/5 hover:bg-black/10 hover:border-black/20 text-slate-700",
        className,
      )}
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  );
}
