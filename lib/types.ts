export type VehicleSize = "XL" | "L" | "M" | "Motorcycle";
export type SlotStatus = "available" | "occupied" | "reserved";
export type SlotZone = "A" | "B" | "C" | "D";

export interface OccupiedVehicle {
  plate: string;
  entryTime: Date;
}

export interface ParkingSlot {
  id: string;
  zone: SlotZone;
  number: number;
  size: VehicleSize;
  sqm: number;
  status: SlotStatus;
  vehicle?: OccupiedVehicle;
}

export interface Transaction {
  id: string;
  plate: string;
  slotId: string;
  size: VehicleSize;
  entryTime: Date;
  exitTime?: Date;
  amount?: number;
  status: "active" | "completed";
  staffId?: string;
}

export interface ZoneConfig {
  zone: SlotZone;
  label: string;
  shortLabel: string;
  size: VehicleSize;
  sqm: number;
  count: number;
  basePrice: number;
  accent: string;
  accentLight: string;
}
