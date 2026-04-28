"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import {
  Save,
  RotateCcw,
  Settings2,
  AlertCircle,
  Minus,
  Plus,
  Loader2,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useParking } from "@/store/parking-store";
import { ZONE_CONFIGS as DEFAULT_ZONE_CONFIGS } from "@/lib/constants";
import type { ZoneConfig } from "@/lib/types";
import { VehicleIcon } from "@/components/shared/vehicle-icon";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

interface ZoneRow {
  zone: string;
  label: string;
  short_label: string;
  size: string;
  sqm: number;
  base_price: number;
}

interface SettingsState {
  free_hours: string;
  excess_hourly_rate: string;
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-28 rounded-md" />
        </div>
      </div>
      {/* Global pricing skeleton */}
      <Card className="dark:border-white/10 border-black/8">
        <CardHeader className="pb-3">
          <Skeleton className="h-3 w-36" />
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-6">
          {[0, 1].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3 w-48" />
              <Skeleton className="h-9 w-32 rounded-md" />
            </div>
          ))}
        </CardContent>
      </Card>
      {/* Zone config skeleton */}
      <Card className="dark:border-white/10 border-black/8">
        <CardHeader className="pb-3">
          <Skeleton className="h-3 w-36" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i}>
              {i > 0 && (
                <Separator className="mb-4 dark:bg-white/8 bg-black/6" />
              )}
              <div className="grid grid-cols-4 gap-4">
                {[0, 1, 2, 3].map((j) => (
                  <div key={j} className="space-y-1.5">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-9 w-full rounded-md" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      {/* Slot capacity skeleton */}
      <Card className="dark:border-white/10 border-black/8">
        <CardHeader className="pb-3">
          <Skeleton className="h-3 w-28" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i}>
              {i > 0 && (
                <Separator className="mb-3 dark:bg-white/8 bg-black/6" />
              )}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-36" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-8 w-28 rounded-lg" />
                  <Skeleton className="h-8 w-20 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

interface SlotCapEntry {
  current: number;
  pending: number;
  occupied: number;
  applying: boolean;
}

export default function SettingsPage() {
  const { setAppSettings, setZoneConfigs, state } = useParking();
  const [settings, setSettings] = useState<SettingsState>({
    free_hours: "",
    excess_hourly_rate: "",
  });
  const [zones, setZones] = useState<ZoneRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const [slotCapacity, setSlotCapacity] = useState<
    Record<string, SlotCapEntry>
  >({});

  async function loadData() {
    setLoadError(false);
    const [
      { data: settingsData, error: sErr },
      { data: zoneData, error: zErr },
    ] = await Promise.all([
      supabase.from("settings").select("key, value"),
      supabase.from("zone_configs").select("*").order("zone"),
    ]);

    if (sErr || zErr) {
      setLoadError(true);
      setLoading(false);
      return;
    }

    if (settingsData) {
      const map: Record<string, string> = {};
      settingsData.forEach((r: { key: string; value: string }) => {
        map[r.key] = r.value;
      });
      setSettings({
        free_hours: map.free_hours ?? "3",
        excess_hourly_rate: map.excess_hourly_rate ?? "20",
      });
    }
    if (zoneData) setZones(zoneData as ZoneRow[]);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync slot capacity from store slots on every realtime update.
  // Preserves `pending` (unsaved stepper value) so user edits survive.
  useEffect(() => {
    if (zones.length === 0) return;
    setSlotCapacity((prev) => {
      const next = { ...prev };
      zones.forEach((z) => {
        const zSlots = state.slots.filter((s) => s.zone === z.zone);
        const occupied = zSlots.filter((s) => s.status === "occupied").length;
        const total = zSlots.length;
        const existing = prev[z.zone];
        next[z.zone] = {
          current: total,
          // Only reset pending on first init (no prior entry)
          pending: existing ? existing.pending : total,
          occupied,
          applying: existing?.applying ?? false,
        };
      });
      return next;
    });
  }, [zones, state.slots]); // eslint-disable-line react-hooks/exhaustive-deps

  async function applySlotChange(zone: string) {
    const cap = slotCapacity[zone];
    if (!cap) return;
    const delta = cap.pending - cap.current;
    if (delta === 0) return;

    const zoneRow = zones.find((z) => z.zone === zone);
    if (!zoneRow) return;

    setSlotCapacity((prev) => ({
      ...prev,
      [zone]: { ...prev[zone], applying: true },
    }));

    if (delta > 0) {
      // Find current max number in this zone
      const { data: maxRow } = await supabase
        .from("parking_slots")
        .select("number")
        .eq("zone", zone)
        .order("number", { ascending: false })
        .limit(1)
        .single();

      const startNum = ((maxRow as { number: number } | null)?.number ?? 0) + 1;
      const inserts = Array.from({ length: delta }, (_, i) => ({
        id: crypto.randomUUID(),
        zone,
        number: startNum + i,
        size: zoneRow.size,
        sqm: zoneRow.sqm,
        status: "available",
      }));

      const { error } = await supabase.from("parking_slots").insert(inserts);
      if (error) {
        toast.error(`Failed to add slots to Zone ${zone}`, {
          description: error.message,
        });
        setSlotCapacity((prev) => ({
          ...prev,
          [zone]: { ...prev[zone], applying: false },
        }));
      } else {
        toast.success(
          `Added ${delta} slot${delta > 1 ? "s" : ""} to Zone ${zone}`,
          { description: "New slots are now live on the grid." },
        );
        setSlotCapacity((prev) => ({
          ...prev,
          [zone]: { ...prev[zone], current: cap.pending, applying: false },
        }));
      }
    } else {
      // Remove |delta| available slots (highest numbers first)
      const count = Math.abs(delta);
      const { data: toDelete } = await supabase
        .from("parking_slots")
        .select("id")
        .eq("zone", zone)
        .eq("status", "available")
        .order("number", { ascending: false })
        .limit(count);

      if (!toDelete || toDelete.length < count) {
        toast.error("Not enough available slots to remove", {
          description: "Occupied slots cannot be removed.",
        });
        setSlotCapacity((prev) => ({
          ...prev,
          [zone]: { ...prev[zone], pending: cap.current, applying: false },
        }));
        return;
      }

      const ids = (toDelete as { id: string }[]).map((r) => r.id);
      const { error } = await supabase
        .from("parking_slots")
        .delete()
        .in("id", ids);

      if (error) {
        toast.error(`Failed to remove slots from Zone ${zone}`, {
          description: error.message,
        });
        setSlotCapacity((prev) => ({
          ...prev,
          [zone]: { ...prev[zone], applying: false },
        }));
      } else {
        toast.success(
          `Removed ${count} slot${count > 1 ? "s" : ""} from Zone ${zone}`,
        );
        setSlotCapacity((prev) => ({
          ...prev,
          [zone]: { ...prev[zone], current: cap.pending, applying: false },
        }));
      }
    }
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    const fh = Number(settings.free_hours);
    const er = Number(settings.excess_hourly_rate);
    if (!settings.free_hours || isNaN(fh) || fh < 0 || fh > 24)
      errs.free_hours = "Must be between 0 and 24";
    if (!settings.excess_hourly_rate || isNaN(er) || er < 0)
      errs.excess_hourly_rate = "Must be 0 or more";
    zones.forEach((z) => {
      if (!z.label.trim()) errs[`${z.zone}_label`] = "Required";
      if (!z.short_label.trim()) errs[`${z.zone}_short`] = "Required";
      if (z.sqm <= 0) errs[`${z.zone}_sqm`] = "Must be > 0";
      if (z.base_price < 0) errs[`${z.zone}_price`] = "Must be 0 or more";
    });
    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function updateZone(zone: string, field: keyof ZoneRow, value: string) {
    setZones((prev) =>
      prev.map((z) =>
        z.zone === zone
          ? {
              ...z,
              [field]:
                field === "base_price" || field === "sqm"
                  ? Number(value)
                  : value,
            }
          : z,
      ),
    );
    // Clear validation error on change
    const keyMap: Record<string, string> = {
      label: `${zone}_label`,
      short_label: `${zone}_short`,
      sqm: `${zone}_sqm`,
      base_price: `${zone}_price`,
    };
    if (keyMap[field]) {
      setValidationErrors((e) => {
        const n = { ...e };
        delete n[keyMap[field]];
        return n;
      });
    }
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    setError(null);

    const settingUpserts = [
      {
        key: "free_hours",
        value: settings.free_hours,
        description: "Free hours before excess charges apply",
      },
      {
        key: "excess_hourly_rate",
        value: settings.excess_hourly_rate,
        description: "PHP charged per hour after free hours",
      },
    ];

    const [settingsRes, ...zoneResults] = await Promise.all([
      supabase.from("settings").upsert(settingUpserts, { onConflict: "key" }),
      ...zones.map((z) =>
        supabase
          .from("zone_configs")
          .update({
            label: z.label,
            short_label: z.short_label,
            base_price: z.base_price,
            sqm: z.sqm,
          })
          .eq("zone", z.zone),
      ),
    ]);

    const anyError = settingsRes.error || zoneResults.some((r) => r.error);
    if (anyError) {
      setError("Failed to save changes. Check your permissions and try again.");
      toast.error("Failed to save settings", {
        description: "Check your permissions and try again.",
      });
    } else {
      // Immediately update Zustand store so all consumers reflect new values
      setAppSettings({
        freeHours: Number(settings.free_hours),
        excessRate: Number(settings.excess_hourly_rate),
      });
      setZoneConfigs(
        zones.map((z) => {
          const existing = DEFAULT_ZONE_CONFIGS.find((c) => c.zone === z.zone);
          return {
            zone: z.zone,
            label: z.label,
            shortLabel: z.short_label,
            size: z.size,
            sqm: z.sqm,
            count: existing?.count ?? 0,
            basePrice: z.base_price,
            accent: existing?.accent ?? "",
            accentLight: existing?.accentLight ?? "",
          } as ZoneConfig;
        }),
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast.success("Settings saved!", {
        description: "Pricing and zone changes are now live.",
      });
    }
    setSaving(false);
  }

  async function handleReset() {
    setLoading(true);
    setValidationErrors({});
    setError(null);
    await loadData();
  }

  if (loading) return <SettingsSkeleton />;

  if (loadError) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <div className="flex items-center gap-2 text-red-500 dark:text-red-400">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm font-medium">Failed to load settings</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setLoading(true);
            loadData();
          }}
        >
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-900/20">
            <Settings2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold dark:text-white text-slate-900">
              Settings
            </h1>
            <p className="text-xs dark:text-zinc-500 text-slate-400">
              Configure pricing and zone settings
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={saving}
            className="gap-2"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className={cn(
              "gap-2 transition-all",
              saved
                ? "bg-emerald-600 hover:bg-emerald-600 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white",
            )}
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Global Pricing */}
      <Card className="dark:border-white/10 border-black/8">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-widest dark:text-white/50 text-slate-500">
            Global Pricing Rules
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-sm dark:text-white/80 text-slate-700">
              Free Hours
            </Label>
            <p className="text-[11px] dark:text-zinc-500 text-slate-400">
              Hours included in base price before excess charges apply
            </p>
            <div className="flex items-center gap-2">
              <div className="space-y-1">
                <Input
                  type="number"
                  min={0}
                  max={24}
                  value={settings.free_hours}
                  onChange={(e) => {
                    setSettings((s) => ({ ...s, free_hours: e.target.value }));
                    setValidationErrors((err) => {
                      const n = { ...err };
                      delete n.free_hours;
                      return n;
                    });
                  }}
                  className={cn(
                    "w-24",
                    validationErrors.free_hours &&
                      "border-red-400 focus-visible:ring-red-400",
                  )}
                />
                {validationErrors.free_hours && (
                  <p className="text-[10px] text-red-500">
                    {validationErrors.free_hours}
                  </p>
                )}
              </div>
              <span className="text-sm dark:text-zinc-400 text-slate-500">
                hours
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm dark:text-white/80 text-slate-700">
              Excess Hourly Rate
            </Label>
            <p className="text-[11px] dark:text-zinc-500 text-slate-400">
              Additional charge per hour beyond the free hours
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm dark:text-zinc-400 text-slate-500">
                ₱
              </span>
              <div className="space-y-1">
                <Input
                  type="number"
                  min={0}
                  value={settings.excess_hourly_rate}
                  onChange={(e) => {
                    setSettings((s) => ({
                      ...s,
                      excess_hourly_rate: e.target.value,
                    }));
                    setValidationErrors((err) => {
                      const n = { ...err };
                      delete n.excess_hourly_rate;
                      return n;
                    });
                  }}
                  className={cn(
                    "w-24",
                    validationErrors.excess_hourly_rate &&
                      "border-red-400 focus-visible:ring-red-400",
                  )}
                />
                {validationErrors.excess_hourly_rate && (
                  <p className="text-[10px] text-red-500">
                    {validationErrors.excess_hourly_rate}
                  </p>
                )}
              </div>
              <span className="text-sm dark:text-zinc-400 text-slate-500">
                / hour
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Zone Configs */}
      <Card className="dark:border-white/10 border-black/8">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-widest dark:text-white/50 text-slate-500">
            Zone Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          {zones.map((zone, i) => (
            <div key={zone.zone}>
              {i > 0 && (
                <Separator className="my-4 dark:bg-white/8 bg-black/6" />
              )}
              <div className="grid grid-cols-4 gap-4 items-start">
                <div className="space-y-1.5">
                  <Label className="text-xs dark:text-white/60 text-slate-500">
                    Zone {zone.zone} — Label
                  </Label>
                  <Input
                    value={zone.label}
                    onChange={(e) =>
                      updateZone(zone.zone, "label", e.target.value)
                    }
                    className={cn(
                      validationErrors[`${zone.zone}_label`] &&
                        "border-red-400",
                    )}
                  />
                  {validationErrors[`${zone.zone}_label`] && (
                    <p className="text-[10px] text-red-500">
                      {validationErrors[`${zone.zone}_label`]}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs dark:text-white/60 text-slate-500">
                    Short Label (tab)
                  </Label>
                  <Input
                    value={zone.short_label}
                    onChange={(e) =>
                      updateZone(zone.zone, "short_label", e.target.value)
                    }
                    className={cn(
                      validationErrors[`${zone.zone}_short`] &&
                        "border-red-400",
                    )}
                  />
                  {validationErrors[`${zone.zone}_short`] && (
                    <p className="text-[10px] text-red-500">
                      {validationErrors[`${zone.zone}_short`]}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs dark:text-white/60 text-slate-500">
                    Sqm per Slot
                  </Label>
                  <div className="flex items-center gap-1.5">
                    <div className="space-y-1 flex-1">
                      <Input
                        type="number"
                        min={1}
                        value={zone.sqm}
                        onChange={(e) =>
                          updateZone(zone.zone, "sqm", e.target.value)
                        }
                        className={cn(
                          validationErrors[`${zone.zone}_sqm`] &&
                            "border-red-400",
                        )}
                      />
                      {validationErrors[`${zone.zone}_sqm`] && (
                        <p className="text-[10px] text-red-500">
                          {validationErrors[`${zone.zone}_sqm`]}
                        </p>
                      )}
                    </div>
                    <span className="text-xs dark:text-zinc-500 text-slate-400 shrink-0 pb-1">
                      sqm
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs dark:text-white/60 text-slate-500">
                    Base Price
                  </Label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm dark:text-zinc-400 text-slate-500 pb-1">
                      ₱
                    </span>
                    <div className="space-y-1 flex-1">
                      <Input
                        type="number"
                        min={0}
                        value={zone.base_price}
                        onChange={(e) =>
                          updateZone(zone.zone, "base_price", e.target.value)
                        }
                        className={cn(
                          validationErrors[`${zone.zone}_price`] &&
                            "border-red-400",
                        )}
                      />
                      {validationErrors[`${zone.zone}_price`] && (
                        <p className="text-[10px] text-red-500">
                          {validationErrors[`${zone.zone}_price`]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Slot Capacity */}
      <Card className="dark:border-white/10 border-black/8">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 dark:text-white/40 text-slate-400" />
            <CardTitle className="text-sm font-semibold uppercase tracking-widest dark:text-white/50 text-slate-500">
              Slot Capacity
            </CardTitle>
          </div>
          <p className="text-[11px] dark:text-zinc-500 text-slate-400 mt-0.5">
            Add or remove physical parking stalls per zone. Occupied slots
            cannot be removed.
          </p>
        </CardHeader>
        <CardContent className="space-y-0">
          {zones.map((zone, i) => {
            const cap = slotCapacity[zone.zone];
            const delta = cap ? cap.pending - cap.current : 0;
            const available = cap ? cap.current - cap.occupied : 0;
            return (
              <div key={zone.zone}>
                {i > 0 && (
                  <Separator className="my-3 dark:bg-white/8 bg-black/6" />
                )}
                <div className="flex items-center justify-between gap-4 py-1">
                  {/* Left: Zone identity */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg dark:bg-white/8 bg-slate-100 border dark:border-white/10 border-slate-200">
                      <VehicleIcon
                        size={zone.size as "XL" | "L" | "M" | "Motorcycle"}
                        className="h-4 w-4 dark:text-white/60 text-slate-500"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium dark:text-white/85 text-slate-800 truncate">
                        Zone {zone.zone} — {zone.short_label}
                      </p>
                      <p className="text-[11px] dark:text-zinc-500 text-slate-400 truncate">
                        {zone.label}
                      </p>
                    </div>
                  </div>

                  {/* Right: Stats + stepper + apply */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Stats pills */}
                    {cap ? (
                      <>
                        <span className="inline-flex items-center gap-1 rounded-full border dark:border-emerald-500/25 border-emerald-200 dark:bg-emerald-500/10 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium dark:text-emerald-400 text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          {available} free
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border dark:border-blue-500/25 border-blue-200 dark:bg-blue-500/10 bg-blue-50 px-2 py-0.5 text-[11px] font-medium dark:text-blue-400 text-blue-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                          {cap.occupied} occupied
                        </span>
                      </>
                    ) : (
                      <span className="text-xs dark:text-zinc-500 text-slate-400">
                        Loading…
                      </span>
                    )}

                    {/* Stepper */}
                    <div className="flex items-center rounded-lg border dark:border-white/12 border-slate-200 overflow-hidden">
                      <button
                        type="button"
                        onClick={() =>
                          cap &&
                          setSlotCapacity((prev) => ({
                            ...prev,
                            [zone.zone]: {
                              ...prev[zone.zone],
                              pending: Math.max(cap.occupied, cap.pending - 1),
                            },
                          }))
                        }
                        disabled={
                          !cap || cap.pending <= cap.occupied || cap.applying
                        }
                        className="flex h-8 w-8 items-center justify-center dark:hover:bg-white/8 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Minus className="h-3 w-3 dark:text-white/70 text-slate-600" />
                      </button>
                      <div className="flex min-w-14 flex-col items-center justify-center border-x dark:border-white/10 border-slate-200 px-2 py-1">
                        <span className="text-sm font-semibold tabular-nums dark:text-white text-slate-900">
                          {cap?.pending ?? "—"}
                        </span>
                        {delta !== 0 && (
                          <span
                            className={cn(
                              "text-[9px] font-bold leading-none",
                              delta > 0
                                ? "text-emerald-500"
                                : "text-orange-500",
                            )}
                          >
                            {delta > 0 ? `+${delta}` : delta}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          cap &&
                          setSlotCapacity((prev) => ({
                            ...prev,
                            [zone.zone]: {
                              ...prev[zone.zone],
                              pending: cap.pending + 1,
                            },
                          }))
                        }
                        disabled={!cap || cap.applying}
                        className="flex h-8 w-8 items-center justify-center dark:hover:bg-white/8 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Plus className="h-3 w-3 dark:text-white/70 text-slate-600" />
                      </button>
                    </div>

                    {/* Apply button */}
                    <Button
                      size="sm"
                      disabled={!cap || delta === 0 || cap.applying}
                      onClick={() => applySlotChange(zone.zone)}
                      className={cn(
                        "h-8 min-w-20 gap-1.5 text-xs transition-all",
                        delta > 0
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : delta < 0
                            ? "bg-orange-600 hover:bg-orange-700 text-white"
                            : "opacity-40 cursor-not-allowed",
                      )}
                    >
                      {cap?.applying ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Applying…
                        </>
                      ) : delta > 0 ? (
                        <>
                          <Plus className="h-3 w-3" />
                          Add {delta}
                        </>
                      ) : delta < 0 ? (
                        <>
                          <Minus className="h-3 w-3" />
                          Remove {Math.abs(delta)}
                        </>
                      ) : (
                        "No change"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
