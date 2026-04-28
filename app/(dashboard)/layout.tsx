import { ParkingProvider } from "@/store/parking-store";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Toaster } from "sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ParkingProvider>
      <div className="relative flex h-screen overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 dark:bg-zinc-950 bg-zinc-50" />
        <AppSidebar />
        <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          {children}
        </main>
      </div>
      <Toaster position="bottom-right" richColors closeButton />
    </ParkingProvider>
  );
}
