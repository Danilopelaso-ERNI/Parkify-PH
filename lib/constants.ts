import type { VehicleSize, ZoneConfig } from "./types";

export const ZONE_CONFIGS: ZoneConfig[] = [
  {
    zone: "A",
    label: "Zone A – XL (SUV / Van)",
    shortLabel: "XL",
    size: "XL",
    sqm: 15,
    count: 15,
    basePrice: 100,
    accent: "text-blue-600",
    accentLight: "bg-blue-50 border-blue-200",
  },
  {
    zone: "B",
    label: "Zone B – Large (Sedan)",
    shortLabel: "Large",
    size: "L",
    sqm: 12,
    count: 20,
    basePrice: 80,
    accent: "text-violet-600",
    accentLight: "bg-violet-50 border-violet-200",
  },
  {
    zone: "C",
    label: "Zone C – Medium (Hatchback)",
    shortLabel: "Medium",
    size: "M",
    sqm: 10,
    count: 30,
    basePrice: 50,
    accent: "text-orange-600",
    accentLight: "bg-orange-50 border-orange-200",
  },
  {
    zone: "D",
    label: "Zone D – Motorcycle",
    shortLabel: "Moto",
    size: "Motorcycle",
    sqm: 3,
    count: 50,
    basePrice: 30,
    accent: "text-emerald-600",
    accentLight: "bg-emerald-50 border-emerald-200",
  },
];

export const EXCESS_HOURLY_RATE = 20;
export const FREE_HOURS = 3;

export const BASE_PRICES: Record<VehicleSize, number> = {
  XL: 100,
  L: 80,
  M: 50,
  Motorcycle: 30,
};

export const VEHICLE_ICONS: Record<VehicleSize, string> = {
  XL: "🚐",
  L: "🚗",
  M: "🚙",
  Motorcycle: "🏍️",
};

export function calculateFee(
  size: VehicleSize,
  entryTime: Date,
  exitTime: Date = new Date(),
  overrides?: { freeHours?: number; excessRate?: number; basePrice?: number },
): number {
  const ms = exitTime.getTime() - entryTime.getTime();
  const hours = Math.max(1, Math.ceil(ms / (1000 * 60 * 60)));
  const base = overrides?.basePrice ?? BASE_PRICES[size];
  const freeHours = overrides?.freeHours ?? FREE_HOURS;
  const excessRate = overrides?.excessRate ?? EXCESS_HOURLY_RATE;
  if (hours <= freeHours) return base;
  return base + (hours - freeHours) * excessRate;
}

export function formatElapsed(entryTime: Date, endTime?: Date): string {
  const ms = (endTime ?? new Date()).getTime() - entryTime.getTime();
  const totalMinutes = Math.floor(Math.max(0, ms) / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

export function getZoneConfig(zone: string) {
  return ZONE_CONFIGS.find((c) => c.zone === zone);
}
