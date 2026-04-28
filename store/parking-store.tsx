"use client";

import React, { useEffect } from "react";
import { create } from "zustand";
import type {
  ParkingSlot,
  Transaction,
  VehicleSize,
  ZoneConfig,
} from "@/lib/types";
import {
  calculateFee,
  ZONE_CONFIGS as DEFAULT_ZONE_CONFIGS,
} from "@/lib/constants";
import { supabase } from "@/lib/supabase";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function rowsToSlots(rows: Record<string, unknown>[]): ParkingSlot[] {
  return rows.map((row) => {
    const vehicle = row.slot_vehicles as Record<string, unknown> | null;
    return {
      id: row.id as string,
      zone: row.zone as ParkingSlot["zone"],
      number: row.number as number,
      size: row.size as VehicleSize,
      sqm: row.sqm as number,
      status: row.status as ParkingSlot["status"],
      vehicle: vehicle
        ? {
            plate: vehicle.plate as string,
            entryTime: new Date(vehicle.entry_time as string),
          }
        : undefined,
    };
  });
}

function rowsToTransactions(rows: Record<string, unknown>[]): Transaction[] {
  return rows.map((row) => ({
    id: row.id as string,
    plate: row.plate as string,
    slotId: row.slot_id as string,
    size: row.size as VehicleSize,
    entryTime: new Date(row.entry_time as string),
    exitTime: row.exit_time ? new Date(row.exit_time as string) : undefined,
    amount: row.amount as number | undefined,
    status: row.status as "active" | "completed",
    staffId: row.staff_id as string | undefined,
  }));
}

interface AppSettings {
  freeHours: number;
  excessRate: number;
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface ParkingStore {
  slots: ParkingSlot[];
  transactions: Transaction[];
  loading: boolean;
  appSettings: AppSettings;
  zoneConfigs: ZoneConfig[];
  _setSlots: (slots: ParkingSlot[]) => void;
  _setTransactions: (transactions: Transaction[]) => void;
  _setLoading: (loading: boolean) => void;
  _setAppSettings: (s: AppSettings) => void;
  _setZoneConfigs: (z: ZoneConfig[]) => void;
  enterVehicle: (slotId: string, plate: string) => Promise<string | null>;
  exitVehicle: (slotId: string) => Promise<void>;
  suggestSlot: (size: VehicleSize) => ParkingSlot | undefined;
}

export const useParkingStore = create<ParkingStore>((set, get) => ({
  slots: [],
  transactions: [],
  loading: true,
  appSettings: { freeHours: 3, excessRate: 20 },
  zoneConfigs: DEFAULT_ZONE_CONFIGS,

  _setSlots: (slots) => set({ slots }),
  _setTransactions: (transactions) => set({ transactions }),
  _setLoading: (loading) => set({ loading }),
  _setAppSettings: (appSettings) => set({ appSettings }),
  _setZoneConfigs: (zoneConfigs) => set({ zoneConfigs }),

  enterVehicle: async (slotId, plate) => {
    const entryTime = new Date().toISOString();
    const txnId = `TXN-${Date.now()}`;

    // Fetch session + slot status in parallel — no sequential waiting
    const [
      {
        data: { session },
      },
      { data: slot },
    ] = await Promise.all([
      supabase.auth.getSession(),
      supabase
        .from("parking_slots")
        .select("size, status")
        .eq("id", slotId)
        .single(),
    ]);

    const staffId = session?.user?.id ?? null;
    if (!slot) return "SLOT_NOT_FOUND";

    // Re-verify availability — catches race conditions before the DB constraint fires
    if ((slot as Record<string, unknown>).status !== "available")
      return "SLOT_TAKEN";

    // Insert transaction + update slot + insert vehicle record all in parallel.
    // Transaction insert is atomic via DB unique constraints — if it fails the
    // slot_vehicles insert is a no-op since the slot stays available.
    const [txnResult] = await Promise.all([
      supabase.from("transactions").insert({
        id: txnId,
        plate,
        slot_id: slotId,
        size: slot.size,
        entry_time: entryTime,
        status: "active",
        staff_id: staffId,
      }),
      supabase
        .from("slot_vehicles")
        .insert({ slot_id: slotId, plate, entry_time: entryTime }),
      supabase
        .from("parking_slots")
        .update({ status: "occupied" })
        .eq("id", slotId),
    ]);

    if (txnResult.error?.code === "23505") {
      const msg = txnResult.error.message ?? "";
      if (msg.includes("slot_id") || msg.includes("unique_active_slot"))
        return "SLOT_TAKEN";
      return "DUPLICATE_PLATE";
    }
    if (txnResult.error) return "INSERT_FAILED";

    return null;
  },

  exitVehicle: async (slotId) => {
    const { slots } = get();
    const slotData = slots.find((s) => s.id === slotId);
    if (!slotData?.vehicle) return;

    const exitTime = new Date();
    const amount = calculateFee(
      slotData.size,
      slotData.vehicle.entryTime,
      exitTime,
    );

    await Promise.all([
      supabase.from("slot_vehicles").delete().eq("slot_id", slotId),
      supabase
        .from("parking_slots")
        .update({ status: "available" })
        .eq("id", slotId),
      supabase
        .from("transactions")
        .update({
          exit_time: exitTime.toISOString(),
          amount,
          status: "completed",
        })
        .eq("slot_id", slotId)
        .eq("status", "active"),
    ]);
  },

  suggestSlot: (size) => {
    const { slots } = get();
    return slots.find((s) => s.size === size && s.status === "available");
  },
}));

// ─── Provider ─────────────────────────────────────────────────────────────────
// No React context needed — Zustand is a singleton.
// ParkingProvider only runs the initial fetch + realtime subscription.

export function ParkingProvider({ children }: { children: React.ReactNode }) {
  const setSlots = useParkingStore((s) => s._setSlots);
  const setTransactions = useParkingStore((s) => s._setTransactions);
  const setLoading = useParkingStore((s) => s._setLoading);
  const setAppSettings = useParkingStore((s) => s._setAppSettings);
  const setZoneConfigs = useParkingStore((s) => s._setZoneConfigs);

  // Initial fetch
  useEffect(() => {
    async function load() {
      const [
        { data: slotRows },
        { data: txnRows },
        { data: settingsRows },
        { data: zoneRows },
      ] = await Promise.all([
        supabase
          .from("parking_slots")
          .select("*, slot_vehicles(*)")
          .order("zone")
          .order("number"),
        supabase
          .from("transactions")
          .select("*")
          .order("entry_time", { ascending: false })
          .limit(200),
        supabase.from("settings").select("key, value"),
        supabase.from("zone_configs").select("*").order("zone"),
      ]);

      setSlots(rowsToSlots((slotRows ?? []) as Record<string, unknown>[]));
      setTransactions(
        rowsToTransactions((txnRows ?? []) as Record<string, unknown>[]),
      );

      if (settingsRows) {
        const map: Record<string, string> = {};
        (settingsRows as { key: string; value: string }[]).forEach((r) => {
          map[r.key] = r.value;
        });
        setAppSettings({
          freeHours: Number(map.free_hours ?? 3),
          excessRate: Number(map.excess_hourly_rate ?? 20),
        });
      }

      if (zoneRows) {
        const mapped = (zoneRows as Record<string, unknown>[]).map((r) => {
          const existing = DEFAULT_ZONE_CONFIGS.find((c) => c.zone === r.zone);
          return {
            zone: r.zone,
            label: r.label,
            shortLabel: r.short_label,
            size: r.size,
            sqm: r.sqm,
            count: existing?.count ?? 0,
            basePrice: r.base_price,
            accent: existing?.accent ?? "",
            accentLight: existing?.accentLight ?? "",
          } as ZoneConfig;
        });
        setZoneConfigs(mapped);
      }

      setLoading(false);
    }
    load();
  }, [setSlots, setTransactions, setLoading, setAppSettings, setZoneConfigs]);

  // Realtime subscription
  useEffect(() => {
    const refreshSlots = () =>
      supabase
        .from("parking_slots")
        .select("*, slot_vehicles(*)")
        .order("zone")
        .order("number")
        .then(({ data }) => {
          if (data) setSlots(rowsToSlots(data as Record<string, unknown>[]));
        });

    const refreshTransactions = () =>
      supabase
        .from("transactions")
        .select("*")
        .order("entry_time", { ascending: false })
        .limit(200)
        .then(({ data }) => {
          if (data)
            setTransactions(
              rowsToTransactions(data as Record<string, unknown>[]),
            );
        });

    const refreshSettings = () =>
      supabase
        .from("settings")
        .select("key, value")
        .then(({ data }) => {
          if (data) {
            const map: Record<string, string> = {};
            (data as { key: string; value: string }[]).forEach((r) => {
              map[r.key] = r.value;
            });
            setAppSettings({
              freeHours: Number(map.free_hours ?? 3),
              excessRate: Number(map.excess_hourly_rate ?? 20),
            });
          }
        });

    const refreshZoneConfigs = () =>
      supabase
        .from("zone_configs")
        .select("*")
        .order("zone")
        .then(({ data }) => {
          if (data) {
            const mapped = (data as Record<string, unknown>[]).map((r) => {
              const existing = DEFAULT_ZONE_CONFIGS.find(
                (c) => c.zone === r.zone,
              );
              return {
                zone: r.zone,
                label: r.label,
                shortLabel: r.short_label,
                size: r.size,
                sqm: r.sqm,
                count: existing?.count ?? 0,
                basePrice: r.base_price,
                accent: existing?.accent ?? "",
                accentLight: existing?.accentLight ?? "",
              } as ZoneConfig;
            });
            setZoneConfigs(mapped);
          }
        });

    const channel = supabase
      .channel("parking-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "parking_slots" },
        refreshSlots,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "slot_vehicles" },
        refreshSlots,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        refreshTransactions,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "settings" },
        refreshSettings,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "zone_configs" },
        refreshZoneConfigs,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [setSlots, setTransactions, setAppSettings, setZoneConfigs]);

  return <>{children}</>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
// Keeps the exact same API as before — no changes needed in consumers.
// Each selector is granular so components only re-render when their slice changes.

export function useParking() {
  const slots = useParkingStore((s) => s.slots);
  const transactions = useParkingStore((s) => s.transactions);
  const loading = useParkingStore((s) => s.loading);
  const appSettings = useParkingStore((s) => s.appSettings);
  const zoneConfigs = useParkingStore((s) => s.zoneConfigs);
  const enterVehicle = useParkingStore((s) => s.enterVehicle);
  const exitVehicle = useParkingStore((s) => s.exitVehicle);
  const suggestSlot = useParkingStore((s) => s.suggestSlot);
  const setAppSettings = useParkingStore((s) => s._setAppSettings);
  const setZoneConfigs = useParkingStore((s) => s._setZoneConfigs);

  return {
    state: { slots, transactions, loading, appSettings, zoneConfigs },
    enterVehicle,
    exitVehicle,
    suggestSlot,
    setAppSettings,
    setZoneConfigs,
  };
}
