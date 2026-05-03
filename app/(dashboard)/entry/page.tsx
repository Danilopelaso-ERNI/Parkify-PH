import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";
import { VehicleEntryForm } from "@/components/parking/vehicle-entry-form";
import type { VehicleSize } from "@/lib/types";

export const metadata: Metadata = {
  title: "Vehicle Entry – Parkify PH",
};

const VALID_SIZES: VehicleSize[] = ["XL", "L", "M", "Motorcycle"];

export default async function EntryPage(props: {
  searchParams: Promise<{ slot?: string; size?: string }>;
}) {
  const sp = await props.searchParams;
  const initialSize = VALID_SIZES.includes(sp.size as VehicleSize)
    ? (sp.size as VehicleSize)
    : undefined;

  return (
    <>
      <AppHeader
        title="Vehicle Entry"
        description="Register incoming vehicles and auto-assign parking slots"
      />

      <div className="flex flex-1 justify-center p-6 pt-8">
        <div className="w-full max-w-md xl:max-w-xl 2xl:max-w-2xl rounded-2xl border dark:border-white/10 border-slate-200 dark:bg-white/5 bg-white dark:backdrop-blur-md p-8 xl:p-10 2xl:p-12 shadow-sm dark:shadow-none">
          <VehicleEntryForm initialSlotId={sp.slot} initialSize={initialSize} />
        </div>
      </div>
    </>
  );
}
