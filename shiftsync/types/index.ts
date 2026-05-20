export type Role = 'employee' | 'manager' | 'owner';
export type RestaurantKey = 'tlc' | 'nickys' | 'farmhouse';
export type PositionKey = 'manager' | 'bartender' | 'barback' | 'bouncer';

export interface User {
  name: string;
  role: Role;
  restaurant: RestaurantKey | null;
  position?: PositionKey;
  username?: string;
  password?: string;
}

export interface Users {
  [pin: number]: User;
}

export interface DayAvail {
  unavailable: boolean;
  start: number;
  end: number;
}

export interface Availability {
  [pin: number]: { [day: string]: DayAvail };
}

export interface Shift {
  s: number;
  e: number;
  position?: PositionKey;
}

export interface Schedule {
  [pin: number]: { [day: string]: Shift | null };
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
