"use client";

import { useState, useRef } from "react";
import {
  Wand2,
  CheckCircle2,
  Loader2,
  ArrowRight,
  MapPin,
  RotateCcw,
  ChevronLeft,
  Upload,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useParking } from "@/store/parking-store";
import { BASE_PRICES } from "@/lib/constants";
import { VehicleIcon } from "@/components/shared/vehicle-icon";
import type { VehicleSize } from "@/lib/types";

const VEHICLE_SIZES: VehicleSize[] = ["XL", "L", "M", "Motorcycle"];

const SIZE_META: Record<VehicleSize, { label: string; sqm: number }> = {
  XL: { label: "SUV / Van", sqm: 15 },
  L: { label: "Large Sedan", sqm: 12 },
  M: { label: "Compact Car", sqm: 10 },
  Motorcycle: { label: "Motorcycle", sqm: 3 },
};

async function detectVehicleFromImage(
  file: File,
): Promise<{ size: VehicleSize; plate: string | null }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const [meta, imageBase64] = dataUrl.split(",");
      const mimeType = meta.split(":")[1].split(";")[0];

      const res = await fetch("/api/detect-vehicle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, mimeType }),
      });

      if (!res.ok) {
        const err = await res.json();
        reject(new Error(err.error ?? "Detection failed"));
        return;
      }

      const data = await res.json();
      resolve({ size: data.size as VehicleSize, plate: data.plate ?? null });
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

type Step = "plate" | "size" | "confirm" | "success";
const STEPS: Step[] = ["plate", "size", "confirm"];

interface VehicleEntryFormProps {
  initialSlotId?: string;
  initialSize?: VehicleSize;
}

export function VehicleEntryForm({
  initialSlotId,
  initialSize,
}: VehicleEntryFormProps = {}) {
  const { state, enterVehicle, suggestSlot } = useParking();
  const [step, setStep] = useState<Step>("plate");
  const [plate, setPlate] = useState("");
  const [size, setSize] = useState<VehicleSize | null>(initialSize ?? null);
  const [overrideSlotId, setOverrideSlotId] = useState<string | null>(
    initialSlotId ?? null,
  );
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [confirmedSlot, setConfirmedSlot] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [entryError, setEntryError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const plateFileInputRef = useRef<HTMLInputElement>(null);

  const availableCount = (s: VehicleSize) =>
    state.slots.filter((sl) => sl.size === s && sl.status === "available")
      .length;

  const suggestedSlot = overrideSlotId
    ? state.slots.find(
        (s) => s.id === overrideSlotId && s.status === "available",
      )
    : size
      ? suggestSlot(size)
      : undefined;
  const stepIndex = STEPS.indexOf(step as (typeof STEPS)[number]);

  // Plate history — find last completed transaction for this plate
  const plateHistory =
    plate.length >= 3
      ? state.transactions
          .filter(
            (t) =>
              t.status === "completed" &&
              t.plate.toUpperCase() === plate.toUpperCase(),
          )
          .sort(
            (a, b) =>
              (b.exitTime?.getTime() ?? 0) - (a.exitTime?.getTime() ?? 0),
          )[0]
      : null;

  const plateHistoryLabel = plateHistory
    ? (() => {
        const daysAgo = Math.floor(
          (Date.now() - (plateHistory.exitTime?.getTime() ?? 0)) /
            (1000 * 60 * 60 * 24),
        );
        const when =
          daysAgo === 0
            ? "earlier today"
            : daysAgo === 1
              ? "yesterday"
              : `${daysAgo} days ago`;
        return `Last visit ${when} · Paid ₱${plateHistory.amount}`;
      })()
    : null;

  // Used on Step 1 — detects plate + size from one photo, skips to confirm
  const handlePlatePhotoChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDetectError(null);
    setPreviewUrl(URL.createObjectURL(file));
    setIsDetecting(true);
    try {
      const { size: detectedSize, plate: detectedPlate } =
        await detectVehicleFromImage(file);
      setSize(detectedSize);
      if (detectedPlate) {
        setPlate(detectedPlate.toUpperCase());
      } else {
        // Plate not visible in photo (e.g. front-facing motorcycle shot) — stay
        // on the plate step so the user can enter it manually.
        setDetectError(
          `${detectedSize} detected — plate not visible in photo. Please enter the plate number manually.`,
        );
      }
      // Zone mismatch: pre-selected slot is for a different vehicle size
      if (overrideSlotId) {
        const overrideSlot = state.slots.find((s) => s.id === overrideSlotId);
        if (overrideSlot && overrideSlot.size !== detectedSize) {
          setOverrideSlotId(null);
          setEntryError(
            `Detected ${detectedSize} vehicle — Zone ${overrideSlot.zone} is for ${overrideSlot.size} vehicles only. Reassigned to the nearest available ${detectedSize} slot.`,
          );
        }
      }
      // Only skip to confirm if we have a plate; otherwise stay so user can type it
      if (detectedPlate) setStep("confirm");
    } catch (err) {
      setDetectError(err instanceof Error ? err.message : "Detection failed");
    } finally {
      setIsDetecting(false);
    }
  };

  // Used on Step 2 — detects size only (plate already entered)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDetectError(null);
    setPreviewUrl(URL.createObjectURL(file));
    setIsDetecting(true);
    try {
      const { size: detectedSize } = await detectVehicleFromImage(file);
      setSize(detectedSize);
      // Zone mismatch: pre-selected slot is for a different vehicle size
      if (overrideSlotId) {
        const overrideSlot = state.slots.find((s) => s.id === overrideSlotId);
        if (overrideSlot && overrideSlot.size !== detectedSize) {
          setOverrideSlotId(null);
          setEntryError(
            `Detected ${detectedSize} vehicle — Zone ${overrideSlot.zone} is for ${overrideSlot.size} vehicles only. Reassigned to the nearest available ${detectedSize} slot.`,
          );
        }
      }
      setStep("confirm");
    } catch (err) {
      setDetectError(err instanceof Error ? err.message : "Detection failed");
    } finally {
      setIsDetecting(false);
    }
  };

  const handleSelectSize = (s: VehicleSize) => {
    setSize(s);
    setEntryError(null);
    setStep("confirm");
  };

  const handleConfirm = async () => {
    if (!size || !suggestedSlot || submitting) return;
    setSubmitting(true);
    setEntryError(null);
    const takenSlotId = suggestedSlot.id;
    const err = await enterVehicle(takenSlotId, plate.toUpperCase());
    if (err === "DUPLICATE_PLATE") {
      setEntryError(`${plate.toUpperCase()} is already parked inside.`);
      setSubmitting(false);
      return;
    }
    if (err === "SLOT_TAKEN") {
      setOverrideSlotId(null);
      const nextSlot = suggestSlot(size);
      setEntryError(
        nextSlot
          ? `Slot ${takenSlotId} was just taken — reassigned to ${nextSlot.id}. Tap Confirm.`
          : `Slot ${takenSlotId} was just taken and no other ${size} slots are available.`,
      );
      setSubmitting(false);
      return;
    }
    if (err) {
      setEntryError("Something went wrong. Please try again.");
      setSubmitting(false);
      return;
    }
    setConfirmedSlot(takenSlotId);
    setStep("success");
    setSubmitting(false);
  };

  const reset = () => {
    setStep("plate");
    setPlate("");
    setSize(null);
    setOverrideSlotId(null);
    setConfirmedSlot(null);
    setPreviewUrl(null);
    setDetectError(null);
    setEntryError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (plateFileInputRef.current) plateFileInputRef.current.value = "";
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (step === "success") {
    return (
      <div className="flex flex-col items-center gap-6 py-10 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-400/15">
          <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white">
            Vehicle Parked!
          </p>
          <p className="mt-1 text-zinc-500 dark:text-white/50">
            <span className="font-mono font-bold text-zinc-800 dark:text-white/90">
              {plate}
            </span>{" "}
            is now checked in
          </p>
        </div>
        <div className="w-full rounded-2xl border-2 border-emerald-200 dark:border-emerald-400/30 bg-emerald-50 dark:bg-emerald-400/10 px-8 py-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            Assigned Slot
          </p>
          <p className="mt-2 text-6xl font-black tracking-tight text-emerald-700 dark:text-emerald-300">
            {confirmedSlot}
          </p>
          {size && (
            <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-emerald-600/80 dark:text-emerald-400/80">
              <VehicleIcon size={size} className="h-4 w-4" />
              {SIZE_META[size].label} · Zone {confirmedSlot?.charAt(0)}
            </p>
          )}
        </div>
        <Button onClick={reset} variant="outline" className="gap-2">
          <RotateCcw className="h-4 w-4" /> Park Another Vehicle
        </Button>
      </div>
    );
  }

  // ── Wizard ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-7">
      {/* Lot full banner — shown when all sizes are 0 available */}
      {!state.loading &&
        VEHICLE_SIZES.every((s) => availableCount(s) === 0) && (
          <div className="rounded-2xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 px-5 py-4 text-center">
            <p className="text-sm font-bold text-rose-600 dark:text-rose-400">
              Parking Lot Full
            </p>
            <p className="mt-0.5 text-xs text-rose-500 dark:text-rose-400/80">
              All slots are currently occupied. Wait for a vehicle to exit.
            </p>
          </div>
        )}

      {/* Progress indicator */}
      <div className="flex items-center">
        {STEPS.map((s, i) => {
          const isActive = step === s;
          const isDone = stepIndex > i;
          return (
            <div key={s} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300",
                    isDone
                      ? "bg-emerald-500 text-white"
                      : isActive
                        ? "bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-500/30"
                        : "bg-zinc-100 dark:bg-white/10 text-zinc-400 dark:text-white/30",
                  )}
                >
                  {isDone ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-semibold uppercase tracking-wide",
                    isActive
                      ? "text-blue-600"
                      : isDone
                        ? "text-emerald-600"
                        : "text-zinc-400 dark:text-white/30",
                  )}
                >
                  {s === "plate" ? "Plate" : s === "size" ? "Size" : "Confirm"}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "mx-2 mb-4 h-0.5 flex-1 transition-all duration-300",
                    isDone ? "bg-emerald-400" : "bg-zinc-100 dark:bg-white/10",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Step 1: Plate ── */}
      {step === "plate" && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
              Enter License Plate
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-white/50">
              Type manually or snap a photo to auto-fill everything
            </p>
          </div>

          {/* AI photo shortcut */}
          <input
            ref={plateFileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handlePlatePhotoChange}
          />
          <button
            type="button"
            onClick={() => plateFileInputRef.current?.click()}
            disabled={isDetecting}
            className={cn(
              "w-full cursor-pointer rounded-2xl border-2 border-dashed p-4 text-center transition-all",
              isDetecting
                ? "cursor-wait border-violet-300 bg-violet-50 dark:bg-violet-500/10"
                : "border-zinc-200 dark:border-white/15 bg-zinc-50 dark:bg-white/5 hover:border-violet-400 hover:bg-violet-50 dark:hover:border-violet-400/50 dark:hover:bg-violet-500/10",
            )}
          >
            {isDetecting ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
                <span className="text-sm font-semibold text-violet-600 dark:text-violet-400">
                  Reading plate & size...
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-500/15">
                  <Wand2 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-zinc-800 dark:text-white/90">
                    AI Scan — Photo of Vehicle
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-white/40">
                    Auto-fills plate + size · skips to confirm
                  </p>
                </div>
              </div>
            )}
          </button>

          {detectError && (
            <p className="rounded-lg bg-red-50 dark:bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400">
              {detectError}
            </p>
          )}

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-100 dark:bg-white/10" />
            <span className="text-xs text-zinc-400 dark:text-white/40">
              or type manually
            </span>
            <div className="h-px flex-1 bg-zinc-100 dark:bg-white/10" />
          </div>

          <Input
            placeholder="ABC-1234"
            value={plate}
            onChange={(e) => {
              setPlate(e.target.value.toUpperCase());
              setDetectError(null);
            }}
            className="h-14 text-center font-mono text-2xl font-bold uppercase tracking-[0.25em]"
            maxLength={10}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && plate.length >= 5)
                size ? setStep("confirm") : setStep("size");
            }}
          />

          {/* Plate history */}
          {plateHistoryLabel && (
            <div className="flex items-center gap-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 px-3.5 py-2.5">
              <History className="h-3.5 w-3.5 shrink-0 text-blue-500" />
              <p className="text-xs font-medium text-blue-700 dark:text-blue-400">
                {plateHistoryLabel}
              </p>
            </div>
          )}
          {plate.length > 0 && plate.length < 5 && (
            <p className="text-center text-xs text-amber-500 dark:text-amber-400">
              Plate must be at least 5 characters
            </p>
          )}
          <Button
            className="h-12 w-full bg-blue-600 font-semibold text-white hover:bg-blue-700"
            disabled={plate.length < 5}
            onClick={() => (size ? setStep("confirm") : setStep("size"))}
          >
            Continue <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}

      {/* ── Step 2: Size ── */}
      {step === "size" && (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setStep("plate")}
              className="rounded-lg p-1 text-zinc-400 dark:text-white/40 hover:bg-zinc-100 dark:hover:bg-white/10 hover:text-zinc-700 dark:hover:text-white/80"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                Vehicle Size
              </h2>
              <p className="text-sm text-zinc-500 dark:text-white/50">
                Upload a photo or select manually
              </p>
            </div>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* AI Upload area */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isDetecting}
            className={cn(
              "w-full cursor-pointer rounded-2xl border-2 border-dashed p-5 text-center transition-all",
              isDetecting
                ? "cursor-wait border-violet-300 bg-violet-50 dark:bg-violet-500/10"
                : "border-zinc-200 dark:border-white/15 bg-zinc-50 dark:bg-white/5 hover:border-violet-400 hover:bg-violet-50 dark:hover:border-violet-400/50 dark:hover:bg-violet-500/10",
            )}
          >
            {isDetecting ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                <p className="text-sm font-semibold text-violet-600 dark:text-violet-400">
                  AI is analyzing the vehicle...
                </p>
              </div>
            ) : previewUrl ? (
              <div className="flex flex-col items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Vehicle preview"
                  className="mx-auto h-28 w-full rounded-lg object-cover"
                />
                <p className="text-xs text-zinc-400 dark:text-white/40">
                  Click to upload a different photo
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-500/15">
                  <Upload className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <p className="text-sm font-semibold text-zinc-700 dark:text-white/80">
                  <Wand2 className="mr-1 inline h-4 w-4 text-violet-500" />
                  AI Auto-Detect from Photo
                </p>
                <p className="text-xs text-zinc-400 dark:text-white/40">
                  Upload JPG / PNG / WebP · GPT-4o Vision
                </p>
              </div>
            )}
          </button>

          {detectError && (
            <p className="rounded-lg bg-red-50 dark:bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400">
              {detectError} — please select manually below.
            </p>
          )}

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-100 dark:bg-white/10" />
            <span className="text-xs text-zinc-400 dark:text-white/40">
              or choose manually
            </span>
            <div className="h-px flex-1 bg-zinc-100 dark:bg-white/10" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {VEHICLE_SIZES.map((s) => {
              const count = availableCount(s);
              return (
                <button
                  key={s}
                  onClick={() => handleSelectSize(s)}
                  disabled={count === 0}
                  className={cn(
                    "rounded-xl border-2 p-4 text-left transition-all",
                    count === 0
                      ? "cursor-not-allowed opacity-40"
                      : "cursor-pointer border-zinc-100 dark:border-white/10 bg-white dark:bg-white/5 hover:border-blue-300 hover:bg-blue-50 dark:hover:border-blue-400/40 dark:hover:bg-blue-500/10",
                  )}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/10">
                    <VehicleIcon
                      size={s}
                      className="h-5 w-5 text-slate-600 dark:text-white/60"
                    />
                  </div>
                  <p className="mt-2 text-xs font-bold text-zinc-800 dark:text-white/90">
                    {s === "Motorcycle"
                      ? "Motorcycle"
                      : `${s} – ${SIZE_META[s].label}`}
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-white/40">
                    ₱{BASE_PRICES[s]} · {SIZE_META[s].sqm} sqm
                  </p>
                  <p
                    className={cn(
                      "mt-1.5 text-xs font-semibold",
                      count > 0 ? "text-emerald-600" : "text-red-500",
                    )}
                  >
                    {count} available
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Step 3: Confirm ── */}
      {step === "confirm" && size && (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setStep("size")}
              className="rounded-lg p-1 text-zinc-400 dark:text-white/40 hover:bg-zinc-100 dark:hover:bg-white/10 hover:text-zinc-700 dark:hover:text-white/80"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                Confirm Entry
              </h2>
              <p className="text-sm text-zinc-500 dark:text-white/50">
                Review before confirming
              </p>
            </div>
          </div>

          {suggestedSlot ? (
            <>
              {/* Manual slot selection banner */}
              {overrideSlotId && (
                <div className="flex items-center justify-between rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-blue-500" />
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-400">
                      Slot manually selected from grid
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setOverrideSlotId(null);
                      setStep("size");
                    }}
                    className="text-xs font-medium text-blue-500 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    Change
                  </button>
                </div>
              )}
              <div className="divide-y divide-zinc-100 dark:divide-white/10 rounded-2xl border dark:border-white/10 bg-zinc-50 dark:bg-white/5">
                {[
                  {
                    label: "License Plate",
                    value: (
                      <span className="font-mono font-bold tracking-widest">
                        {plate}
                      </span>
                    ),
                  },
                  {
                    label: "Vehicle Type",
                    value: (
                      <span className="flex items-center gap-1.5">
                        <VehicleIcon
                          size={size}
                          className="h-4 w-4 text-slate-600 dark:text-white/50"
                        />
                        {SIZE_META[size].label}
                      </span>
                    ),
                  },
                  {
                    label: "Assigned Slot",
                    value: (
                      <span className="flex items-center gap-1 font-bold text-blue-600">
                        <MapPin className="h-4 w-4" />
                        {suggestedSlot.id}
                      </span>
                    ),
                  },
                  {
                    label: "Zone",
                    value: `Zone ${suggestedSlot.zone}`,
                  },
                  {
                    label: "Rate",
                    value: `₱${BASE_PRICES[size]} / 3 hrs · +₱20/hr after`,
                  },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between px-5 py-3.5"
                  >
                    <span className="text-sm text-zinc-500 dark:text-white/40">
                      {label}
                    </span>
                    <span className="text-sm font-semibold text-zinc-800 dark:text-white/90">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
              {entryError && (
                <div className="mx-5 flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 px-4 py-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                  <p className="text-xs text-rose-600 dark:text-rose-400">
                    {entryError}
                  </p>
                </div>
              )}
              <Button
                onClick={handleConfirm}
                disabled={submitting}
                className="h-12 w-full bg-blue-600 font-semibold text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Confirm Entry
                  </>
                )}
              </Button>
            </>
          ) : (
            <div className="rounded-xl bg-red-50 dark:bg-red-500/10 p-5 text-center">
              <p className="font-semibold text-red-600 dark:text-red-400">
                No {size} slots available
              </p>
              <Button
                variant="outline"
                onClick={() => setStep("size")}
                className="mt-3"
              >
                Choose Different Size
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
