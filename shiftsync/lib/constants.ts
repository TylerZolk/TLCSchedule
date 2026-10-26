import { Users, Schedule, Restaurants, Shift, PositionKey, RestaurantKey, ShiftRequirements } from '@/types';

export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const HOURS: { value: number; label: string }[] = Array.from({ length: 48 }, (_, i) => {
  const v = i / 2;
  const hr = Math.floor(v);
  const mins = v % 1 === 0.5 ? ':30' : ':00';
  let label: string;
  if (hr === 0)       label = `12${mins} AM`;
  else if (hr < 12)   label = `${hr}${mins} AM`;
  else if (hr === 12) label = `12${mins} PM`;
  else                label = `${hr - 12}${mins} PM`;
  return { value: v, label };
});

export const RESTAURANTS: Restaurants = {
  tlc:       { name: 'TLC',       badgeClass: 'badge-tlc' },
  nickys:    { name: "Nicky's",   badgeClass: 'badge-nickys' },
  farmhouse: { name: 'Farmhouse', badgeClass: 'badge-farm' },
};

export const POSITIONS: Record<RestaurantKey, { key: PositionKey; label: string; className: string }[]> = {
  tlc: [
    { key: 'manager',   label: 'Manager',   className: 'position-manager' },
    { key: 'bartender', label: 'Bartender', className: 'position-bartender' },
    { key: 'barback',   label: 'Barback',   className: 'position-barback' },
    { key: 'bouncer',   label: 'Bouncer',   className: 'position-bouncer' },
    { key: 'on_call',   label: 'On Call',   className: 'position-on-call' },
  ],
  nickys: [],
  farmhouse: [
    { key: 'manager',   label: 'Manager',   className: 'position-manager' },
    { key: 'kitchen',   label: 'Kitchen',   className: 'position-kitchen' },
    { key: 'server',    label: 'Server',    className: 'position-server' },
    { key: 'bartender', label: 'Bartender', className: 'position-bartender' },
    { key: 'on_call',   label: 'On Call',   className: 'position-on-call' },
  ],
};

export function getPositionsForRestaurant(restaurant?: RestaurantKey | null) {
  return restaurant ? POSITIONS[restaurant] : [];
}

const ALL_POSITIONS = Object.values(POSITIONS).flat();

export function getPositionLabel(position?: PositionKey): string {
  return ALL_POSITIONS.find((p) => p.key === position)?.label ?? 'Shift';
}

export function positionColorClass(position?: PositionKey): string {
  return ALL_POSITIONS.find((p) => p.key === position)?.className ?? shiftColorClass(12);
}

/** "6:00am", "6:30am", "2:00pm" */
export function fmtHour(h: number): string {
  const hr = Math.floor(h);
  const mins = h % 1 === 0.5 ? ':30' : ':00';
  if (hr === 0)  return `12${mins}am`;
  if (hr < 12)   return `${hr}${mins}am`;
  if (hr === 12) return `12${mins}pm`;
  return `${hr - 12}${mins}pm`;
}

/** "6a", "6:30a", "2p" */
export function fmtShort(h: number): string {
  const hr = Math.floor(h);
  const mins = h % 1 === 0.5 ? ':30' : '';
  if (hr === 0)  return `12${mins}a`;
  if (hr < 12)   return `${hr}${mins}a`;
  if (hr === 12) return `12${mins}p`;
  return `${hr - 12}${mins}p`;
}

export function fmtRange(start: number, end: number): string {
  return `${fmtShort(start)}-${fmtShort(end)}`;
}

/** Tailwind-safe class names for fallback shift color by start hour */
export function shiftColorClass(s: number): string {
  if (s < 11) return 'shift-morning';
  if (s < 15) return 'shift-mid';
  return 'shift-evening';
}

/** "AA" initials from a full name */
export function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function getWeekDates(offset = 0): Date[] {
  const now = new Date();
  const sun = new Date(now);
  sun.setDate(now.getDate() - now.getDay() + offset * 7);
  return DAYS.map((_, i) => {
    const d = new Date(sun);
    d.setDate(sun.getDate() + i);
    return d;
  });
}

export function getWeekDatesFor(weekStart: string): Date[] {
  const [y, m, d] = weekStart.split('-').map(Number);
  return DAYS.map((_, i) => new Date(y, m - 1, d + i));
}

export function weekLabel(dates: Date[]): string {
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(dates[0])} – ${fmt(dates[6])}`;
}

export interface LaborSummary {
  totalCost: number;
  totalHours: number;
  byPosition: { key: PositionKey; label: string; hours: number; cost: number; headcount: number }[];
}

export function buildLaborSummary(
  restaurant: RestaurantKey,
  pins: number[],
  users: Users,
  schedule: Schedule,
): LaborSummary {
  const dur = (sh: Shift) => sh.e > sh.s ? sh.e - sh.s : 24 - sh.s + sh.e;
  const positions = POSITIONS[restaurant] ?? [];
  let totalCost = 0;
  let totalHours = 0;
  const byPosition = positions.map((pos) => ({ key: pos.key, label: pos.label, hours: 0, cost: 0, headcount: 0 }));
  const countedHeads: Record<string, Set<number>> = {};
  positions.forEach((p) => { countedHeads[p.key] = new Set(); });
  for (const pin of pins) {
    const wage = users[pin]?.wage ?? 0;
    const userPos = users[pin]?.position;
    for (const day of DAYS) {
      const shifts = schedule[pin]?.[day] ?? [];
      for (const sh of shifts) {
        const h = dur(sh);
        const cost = h * wage;
        totalHours += h;
        totalCost  += cost;
        const pos = sh.position ?? userPos;
        const bucket = byPosition.find((b) => b.key === pos);
        if (bucket) {
          bucket.hours += h;
          bucket.cost  += cost;
          if (!countedHeads[pos!]?.has(pin)) { bucket.headcount++; countedHeads[pos!]?.add(pin); }
        }
      }
    }
  }
  return { totalCost, totalHours, byPosition };
}

export function buildInitialShiftRequirements(): ShiftRequirements {
  const reqs = {} as ShiftRequirements;
  for (const rest of Object.keys(RESTAURANTS) as RestaurantKey[]) {
    reqs[rest] = {};
    DAYS.forEach((d) => { reqs[rest][d] = {}; });
  }
  return reqs;
}
