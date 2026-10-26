import { Shift as DbShift } from '@prisma/client';
import { DAYS, POSITIONS, RESTAURANTS } from '@/lib/constants';
import { HttpError } from '@/lib/auth';
import { PositionKey, RestaurantKey, Schedule, Shift } from '@/types';

export function day(v: unknown): string {
  if (typeof v !== 'string' || !DAYS.includes(v)) throw new HttpError(400, 'Invalid day.');
  return v;
}

/** Half-hour steps from 0 to 23.5 */
export function hour(v: unknown): number {
  if (typeof v !== 'number' || v < 0 || v >= 24 || (v * 2) % 1 !== 0) throw new HttpError(400, 'Invalid time.');
  return v;
}

export function restaurant(v: unknown): RestaurantKey {
  if (typeof v !== 'string' || !(v in RESTAURANTS)) throw new HttpError(400, 'Invalid restaurant.');
  return v as RestaurantKey;
}

export function position(rest: string | null, v: unknown): PositionKey | null {
  if (v == null || v === '') return null;
  const ok = rest && POSITIONS[rest as RestaurantKey]?.some((p) => p.key === v);
  if (!ok) throw new HttpError(400, 'Invalid position.');
  return v as PositionKey;
}

export function pin(v: unknown): number {
  const n = typeof v === 'string' ? Number(v) : v;
  if (typeof n !== 'number' || !Number.isInteger(n) || n < 1000 || n > 9999) throw new HttpError(400, 'PIN must be exactly 4 digits.');
  return n;
}

export function weekStart(v: unknown): string {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new HttpError(400, 'Invalid week.');
  return v;
}

export function str(v: unknown, label: string, max = 100): string {
  if (typeof v !== 'string' || !v.trim()) throw new HttpError(400, `${label} is required.`);
  return v.trim().slice(0, max);
}

// ─── Shaping ──────────────────────────────────────────────────────────────────

export function shapeShift(s: DbShift): Shift {
  return { id: s.id, s: s.start, e: s.end, ...(s.position ? { position: s.position as PositionKey } : {}) };
}

/** Builds { pin: { day: Shift[] } } with an empty array for every day of every pin. */
export function shapeSchedule(pins: number[], shifts: DbShift[]): Schedule {
  const schedule: Schedule = {};
  for (const p of pins) {
    schedule[p] = {};
    for (const d of DAYS) schedule[p][d] = [];
  }
  for (const s of shifts) schedule[s.pin]?.[s.day]?.push(shapeShift(s));
  return schedule;
}
