import type { ParkingSlot, Transaction } from "./types";
import { ZONE_CONFIGS } from "./constants";

// Deterministic mock state — indices that are occupied or reserved
const OCCUPIED_INDICES = new Set([
  0, 2, 4, 7, 10, 13, 15, 17, 19, 22, 25, 28, 30, 33, 38, 42, 47, 52, 58, 65,
  72, 80,
]);
const RESERVED_INDICES = new Set([1, 6, 14, 21, 36, 55]);

const PLATES = [
  "ABC-1234",
  "XYZ-5678",
  "DEF-9012",
  "GHI-3456",
  "JKL-7890",
  "MNO-1111",
  "PQR-2222",
  "STU-3333",
  "VWX-4444",
  "YZA-5555",
  "BCD-6666",
  "EFG-7777",
  "HIJ-8888",
  "KLM-9999",
  "NOP-0000",
  "QRS-1357",
  "TUV-2468",
  "WXY-9753",
  "ZAB-8642",
  "CDE-7531",
  "FGH-1234",
  "IJK-5678",
];

// Fixed minute offsets so entry times are deterministic relative to mount time
// Entries > 180 min (3 h) will trigger the overstay badge
const ENTRY_OFFSETS_MIN = [
  10, 25, 45, 70, 95, 120, 150, 30, 60, 90, 15, 240, 300, 40, 55, 80, 360, 35,
  65, 220, 400, 20,
];

export function generateMockSlots(): ParkingSlot[] {
  const slots: ParkingSlot[] = [];
  let globalIdx = 0;
  let plateIdx = 0;
  const now = Date.now();

  for (const cfg of ZONE_CONFIGS) {
    for (let i = 1; i <= cfg.count; i++) {
      const id = `${cfg.zone}-${String(i).padStart(2, "0")}`;

      if (OCCUPIED_INDICES.has(globalIdx)) {
        const minsAgo = ENTRY_OFFSETS_MIN[plateIdx % ENTRY_OFFSETS_MIN.length];
        slots.push({
          id,
          zone: cfg.zone,
          number: i,
          size: cfg.size,
          sqm: cfg.sqm,
          status: "occupied",
          vehicle: {
            plate: PLATES[plateIdx % PLATES.length],
            entryTime: new Date(now - minsAgo * 60 * 1000),
          },
        });
        plateIdx++;
      } else if (RESERVED_INDICES.has(globalIdx)) {
        slots.push({
          id,
          zone: cfg.zone,
          number: i,
          size: cfg.size,
          sqm: cfg.sqm,
          status: "reserved",
        });
      } else {
        slots.push({
          id,
          zone: cfg.zone,
          number: i,
          size: cfg.size,
          sqm: cfg.sqm,
          status: "available",
        });
      }

      globalIdx++;
    }
  }

  return slots;
}

export function generateMockTransactions(): Transaction[] {
  const now = Date.now();
  return [
    {
      id: "TXN-001",
      plate: "ABC-1234",
      slotId: "A-01",
      size: "XL",
      entryTime: new Date(now - 10 * 60000),
      status: "active",
    },
    {
      id: "TXN-002",
      plate: "XYZ-5678",
      slotId: "B-03",
      size: "L",
      entryTime: new Date(now - 25 * 60000),
      status: "active",
    },
    {
      id: "TXN-003",
      plate: "DEF-9012",
      slotId: "C-05",
      size: "M",
      entryTime: new Date(now - 4 * 60 * 60000),
      exitTime: new Date(now - 30 * 60000),
      amount: 70,
      status: "completed",
    },
    {
      id: "TXN-004",
      plate: "GHI-3456",
      slotId: "D-08",
      size: "Motorcycle",
      entryTime: new Date(now - 2 * 60 * 60000),
      exitTime: new Date(now - 10 * 60000),
      amount: 30,
      status: "completed",
    },
    {
      id: "TXN-005",
      plate: "JKL-7890",
      slotId: "A-11",
      size: "XL",
      entryTime: new Date(now - 45 * 60000),
      status: "active",
    },
    {
      id: "TXN-006",
      plate: "MNO-1111",
      slotId: "B-08",
      size: "L",
      entryTime: new Date(now - 4 * 60 * 60000),
      exitTime: new Date(now - 60 * 60000),
      amount: 100,
      status: "completed",
    },
    {
      id: "TXN-007",
      plate: "PQR-2222",
      slotId: "C-15",
      size: "M",
      entryTime: new Date(now - 90 * 60000),
      status: "active",
    },
    {
      id: "TXN-008",
      plate: "STU-3333",
      slotId: "D-22",
      size: "Motorcycle",
      entryTime: new Date(now - 150 * 60000),
      status: "active",
    },
  ];
}
