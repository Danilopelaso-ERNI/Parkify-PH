"use client";

import { useRouter } from "next/navigation";
import { SlotGrid } from "./slot-grid";
import type { ParkingSlot } from "@/lib/types";

export function DashboardSlotGrid() {
  const router = useRouter();

  const handleSlotSelect = (slot: ParkingSlot) => {
    router.push(`/entry?slot=${slot.id}&size=${slot.size}`);
  };

  return <SlotGrid onSlotSelect={handleSlotSelect} />;
}
