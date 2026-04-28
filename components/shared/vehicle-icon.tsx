import { cn } from "@/lib/utils";
import type { VehicleSize } from "@/lib/types";

// Side-profile vehicle silhouettes (front = left)
// viewBox 0 0 64 36 — wheel arches use A(r,r 0 0 0) for upward concave cutouts

function SUVIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 36"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      {/* Body */}
      <path d="M4,28 L4,17 Q4,10 9,9 L45,9 Q53,9 57,15 L61,21 L61,28 Z" />
      {/* Windows */}
      <rect
        x="10"
        y="11"
        width="15"
        height="14"
        rx="1.5"
        fill="rgba(0,0,0,0.28)"
      />
      <rect
        x="28"
        y="11"
        width="16"
        height="14"
        rx="1.5"
        fill="rgba(0,0,0,0.28)"
      />
      {/* Wheels */}
      <circle cx="16" cy="28" r="6" fill="currentColor" />
      <circle cx="16" cy="28" r="6" fill="rgba(0,0,0,0.22)" />
      <circle cx="16" cy="28" r="3" fill="rgba(0,0,0,0.5)" />
      <circle cx="48" cy="28" r="6" fill="currentColor" />
      <circle cx="48" cy="28" r="6" fill="rgba(0,0,0,0.22)" />
      <circle cx="48" cy="28" r="3" fill="rgba(0,0,0,0.5)" />
    </svg>
  );
}

function SedanIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 36"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      {/* Body — long hood, cabin hump, short trunk */}
      <path d="M4,28 L4,22 L8,18 L14,14 Q18,11 22,10 L32,9 L44,9 Q50,10 53,13 L60,20 L61,28 Z" />
      {/* Windows */}
      <rect
        x="23"
        y="11"
        width="12"
        height="11"
        rx="1.5"
        fill="rgba(0,0,0,0.28)"
      />
      <rect
        x="37"
        y="11"
        width="12"
        height="11"
        rx="1.5"
        fill="rgba(0,0,0,0.28)"
      />
      {/* Wheels */}
      <circle cx="15" cy="28" r="6" fill="currentColor" />
      <circle cx="15" cy="28" r="6" fill="rgba(0,0,0,0.22)" />
      <circle cx="15" cy="28" r="3" fill="rgba(0,0,0,0.5)" />
      <circle cx="49" cy="28" r="6" fill="currentColor" />
      <circle cx="49" cy="28" r="6" fill="rgba(0,0,0,0.22)" />
      <circle cx="49" cy="28" r="3" fill="rgba(0,0,0,0.5)" />
    </svg>
  );
}

function HatchbackIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 36"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      {/* Compact 2-box — roofline slopes steeply into rear */}
      <path d="M4,28 L4,22 L8,18 L12,14 Q16,11 20,10 L30,9 L42,9 Q46,9 48,11 L56,18 Q59,23 59,28 Z" />
      {/* Windows */}
      <rect
        x="21"
        y="11"
        width="13"
        height="11"
        rx="1.5"
        fill="rgba(0,0,0,0.28)"
      />
      <rect
        x="36"
        y="12"
        width="9"
        height="10"
        rx="1.5"
        fill="rgba(0,0,0,0.28)"
      />
      {/* Wheels */}
      <circle cx="15" cy="28" r="6" fill="currentColor" />
      <circle cx="15" cy="28" r="6" fill="rgba(0,0,0,0.22)" />
      <circle cx="15" cy="28" r="3" fill="rgba(0,0,0,0.5)" />
      <circle cx="47" cy="28" r="6" fill="currentColor" />
      <circle cx="47" cy="28" r="6" fill="rgba(0,0,0,0.22)" />
      <circle cx="47" cy="28" r="3" fill="rgba(0,0,0,0.5)" />
    </svg>
  );
}

function MotoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 36"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      {/* Two wheels */}
      <circle cx="13" cy="26" r="8" />
      <circle cx="51" cy="26" r="8" />
      {/* Frame — sweeps from front fork up through engine to swingarm */}
      <path d="M19,26 L23,16 Q30,8 36,8 L42,8 Q48,12 51,20" />
      {/* Fuel tank + seat */}
      <ellipse cx="32" cy="9" rx="10" ry="4" />
      {/* Handlebars */}
      <rect x="7" y="16" width="12" height="3" rx="1.5" />
    </svg>
  );
}

interface VehicleIconProps {
  size: VehicleSize;
  className?: string;
}

export function VehicleIcon({ size, className }: VehicleIconProps) {
  const cls = cn("h-4 w-4", className);
  switch (size) {
    case "XL":
      return <SUVIcon className={cls} />;
    case "L":
      return <SedanIcon className={cls} />;
    case "M":
      return <HatchbackIcon className={cls} />;
    case "Motorcycle":
      return <MotoIcon className={cls} />;
  }
}
