import { Users, Availability, Schedule, Restaurants, Shift, PositionKey, RestaurantKey, ShiftRequirements } from '@/types';

export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const HOURS: { value: number; label: string }[] = Array.from({ length: 24 }, (_, h) => ({
  value: h,
  label:
    h === 0  ? '12:00 AM'
    : h < 12 ? `${h}:00 AM`
    : h === 12 ? '12:00 PM'
    : `${h - 12}:00 PM`,
}));

export const RESTAURANTS: Restaurants = {
  tlc:       { name: 'TLC',       badgeClass: 'badge-tlc' },
  nickys:    { name: "Nicky's",   badgeClass: 'badge-nickys' },
  farmhouse: { name: 'Farmhouse', badgeClass: 'badge-farm' },
};

export const POSITIONS: Record<RestaurantKey, { key: PositionKey; label: string; className: string }[]> = {
  tlc: [
    { key: 'manager',   label: 'Manager',   className: 'position-manager' },
    { key: 'bartender', label: 'Bartender', className: 'position-bartender' },
    { key: 'barback',  label: 'Barback',  className: 'position-barback' },
    { key: 'bouncer',  label: 'Bouncer',  className: 'position-bouncer' },
  ],
  nickys: [],
  farmhouse: [],
};

export function getPositionsForRestaurant(restaurant?: RestaurantKey | null) {
  return restaurant ? POSITIONS[restaurant] : [];
}

export function getPositionLabel(position?: PositionKey): string {
  return POSITIONS.tlc.find((p) => p.key === position)?.label ?? 'Shift';
}

export function positionColorClass(position?: PositionKey): string {
  return POSITIONS.tlc.find((p) => p.key === position)?.className ?? shiftColorClass(12);
}

/** "6:00am", "2:00pm" */
export function fmtHour(h: number): string {
  if (h === 0)  return '12:00am';
  if (h < 12)   return `${h}:00am`;
  if (h === 12) return '12:00pm';
  return `${h - 12}:00pm`;
}

/** "6a", "2p" */
export function fmtShort(h: number): string {
  if (h === 0)  return '12a';
  if (h < 12)   return `${h}a`;
  if (h === 12) return '12p';
  return `${h - 12}p`;
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

export function weekLabel(dates: Date[]): string {
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(dates[0])} – ${fmt(dates[6])}`;
}

// ─── Initial data ─────────────────────────────────────────────────────────────

export const INITIAL_USERS: Users = {
  1111: { name: 'Owner',       role: 'owner',    restaurant: null,        username: 'owner', password: 'owner123' },
  2222: { name: 'Alex Morgan', role: 'manager',  restaurant: 'tlc',       position: 'manager', username: 'alex',  password: 'tlc123' },
  3333: { name: 'Dana Price',  role: 'manager',  restaurant: 'nickys',    username: 'dana',  password: 'nickys123' },
  4444: { name: 'Blake Stone', role: 'manager',  restaurant: 'farmhouse', username: 'blake', password: 'farm123' },
  1001: { name: 'Jordan Lee',    role: 'employee', restaurant: 'tlc', position: 'bartender' },
  1002: { name: 'Sam Rivera',   role: 'employee', restaurant: 'tlc', position: 'barback'   },
  1003: { name: 'Chris Park',   role: 'employee', restaurant: 'tlc', position: 'bouncer'   },
  1004: { name: 'Mia Torres',   role: 'employee', restaurant: 'tlc', position: 'bartender' },
  1005: { name: 'Eli Brooks',   role: 'employee', restaurant: 'tlc', position: 'bartender' },
  1006: { name: 'Nora Hayes',   role: 'employee', restaurant: 'tlc', position: 'bartender' },
  1007: { name: 'Dean Russo',   role: 'employee', restaurant: 'tlc', position: 'bartender' },
  1008: { name: 'Leo Grant',    role: 'employee', restaurant: 'tlc', position: 'barback'   },
  1009: { name: 'Priya Nair',   role: 'employee', restaurant: 'tlc', position: 'barback'   },
  1010: { name: 'Zara Patel',   role: 'employee', restaurant: 'tlc', position: 'bouncer'   },
  1011: { name: 'Owen Clarke',  role: 'employee', restaurant: 'tlc', position: 'bouncer'   },
  1012: { name: 'Ruby James',   role: 'employee', restaurant: 'tlc', position: 'bouncer'   },
  1013: { name: 'Finn Walsh',   role: 'employee', restaurant: 'tlc', position: 'bouncer'   },
  2001: { name: 'Taylor Kim',  role: 'employee', restaurant: 'nickys' },
  2002: { name: 'Jamie Bell',  role: 'employee', restaurant: 'nickys' },
  2003: { name: 'Morgan Chen', role: 'employee', restaurant: 'nickys' },
  3001: { name: 'Riley Fox',   role: 'employee', restaurant: 'farmhouse' },
  3002: { name: 'Casey Webb',  role: 'employee', restaurant: 'farmhouse' },
  3003: { name: 'Quinn Adams', role: 'employee', restaurant: 'farmhouse' },
};

export function buildInitialAvailability(users: Users): Availability {
  const av: Availability = {};
  Object.keys(users).forEach((p) => {
    av[Number(p)] = {};
    DAYS.forEach((d) => { av[Number(p)][d] = { unavailable: false, start: 9, end: 17 }; });
  });
  av[1001]['Sun'] = { unavailable: true,  start: 9,  end: 17 };
  av[1001]['Mon'] = { unavailable: false, start: 8,  end: 14 };
  av[1002]['Sat'] = { unavailable: true,  start: 9,  end: 17 };
  av[2001]['Mon'] = { unavailable: false, start: 10, end: 20 };
  av[3001]['Thu'] = { unavailable: true,  start: 9,  end: 17 };
  return av;
}

const SHIFT_PATTERNS: (Shift | null)[][] = [
  [null,          { s: 6,  e: 14 }, { s: 6,  e: 14 }, { s: 10, e: 18 }, { s: 6,  e: 14 }, null,           null          ],
  [null,          { s: 10, e: 18 }, { s: 14, e: 22 }, { s: 14, e: 22 }, { s: 10, e: 18 }, { s: 10, e: 18 }, null        ],
  [{ s: 14, e: 22 }, null,          { s: 10, e: 18 }, { s: 6,  e: 14 }, null,             { s: 14, e: 22 }, { s: 14, e: 22 }],
];

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
      const sh = schedule[pin]?.[day];
      if (!sh) continue;
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

export function buildInitialSchedule(users: Users): Schedule {
  const s: Schedule = {};
  let pi = 0;
  Object.entries(users).forEach(([p, u]) => {
    if (u.role === 'employee' || u.role === 'manager') {
      s[Number(p)] = {};
      const pat = SHIFT_PATTERNS[pi % 3]; pi++;
      DAYS.forEach((d, i) => { s[Number(p)][d] = pat[i] ? { ...pat[i]!, position: u.position } : null; });
    }
  });
  return s;
}
