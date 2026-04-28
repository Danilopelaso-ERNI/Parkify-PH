import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SlotStatus } from "@/lib/types";

const STATUS_CONFIG: Record<
  SlotStatus,
  { label: string; dot: string; className: string }
> = {
  available: {
    label: "Available",
    dot: "bg-emerald-500",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
  },
  occupied: {
    label: "Occupied",
    dot: "bg-rose-500",
    className: "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-50",
  },
  reserved: {
    label: "Reserved",
    dot: "bg-amber-500",
    className: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50",
  },
};

interface StatusBadgeProps {
  status: SlotStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status];
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 font-medium", cfg.className, className)}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </Badge>
  );
}
