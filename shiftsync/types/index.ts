export type Role = 'employee' | 'on_call' | 'manager' | 'owner';
export type RestaurantKey = 'tlc' | 'nickys' | 'farmhouse';
export type PositionKey = 'manager' | 'bartender' | 'barback' | 'bouncer' | 'kitchen' | 'server';

export interface User {
  name: string;
  role: Role;
  restaurant: RestaurantKey | null;
  position?: PositionKey;
  username?: string;
  password?: string;
  wage?: number;
  isMinor?: boolean;
}

export type ComplianceSeverity = 'info' | 'warning' | 'error';

export interface ComplianceWarning {
  type: 'overtime' | 'short-rest' | 'long-shift' | 'minor-violation' | 'changed-after-publish';
  severity: ComplianceSeverity;
  pin: number;
  message: string;
}

export interface Users {
  [pin: number]: User;
}

export interface DayAvail {
  unavailable: boolean;
  open: boolean;       // available any hours — ignores start/end
  start: number;
  end: number;
}

export interface Availability {
  [pin: number]: { [day: string]: DayAvail };
}

export interface Shift {
  id?: number;         // database ID (undefined for unsaved shifts)
  s: number;
  e: number;
  position?: PositionKey;
}

export interface Schedule {
  [pin: number]: { [day: string]: Shift[] };
}

export interface Restaurant {
  name: string;
  badgeClass: string;
}

export interface Restaurants {
  [key: string]: Restaurant;
}

export interface ShiftSlot {
  id: string;
  start: number;
  end: number;
  count: number;
}

export type ShiftRequirements = {
  [R in RestaurantKey]: {
    [day: string]: Partial<Record<PositionKey, ShiftSlot[]>>;
  };
};

export interface ShiftPreset {
  id: number;
  name: string;
  start: number;
  end: number;
  position?: PositionKey;
}

export interface SwapRequest {
  id: string;
  fromPin: number;
  fromDay: string;
  toPin: number;
  toDay: string;
  status: 'pending' | 'awaiting_approval' | 'accepted' | 'declined';
}
