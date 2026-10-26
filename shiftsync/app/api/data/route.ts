import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { DAYS } from '@/lib/constants';
import { requireUser, route } from '@/lib/auth';
import { shapeSchedule, weekStart as parseWeekStart } from '@/lib/validate';
import { PublishedWeek, Schedule } from '@/types';

const SCHEDULABLE = ['employee', 'manager'];

export const GET = route(async (req) => {
  const me = await requireUser();
  const weekStart = parseWeekStart(new URL(req.url).searchParams.get('weekStart'));
  const isStaff   = me.role === 'employee';

  // Owners see everything; everyone else only their own restaurant
  const restaurantFilter = me.role === 'owner' ? {} : { restaurant: me.restaurant ?? '__none__' };
  const users = await prisma.user.findMany({
    where: isStaff ? { ...restaurantFilter, role: { in: SCHEDULABLE } } : restaurantFilter,
  });
  const pins        = users.map((u) => u.pin);
  const schedPins   = users.filter((u) => SCHEDULABLE.includes(u.role)).map((u) => u.pin);
  const restaurants = me.role === 'owner'
    ? [...new Set(users.map((u) => u.restaurant).filter((r): r is string => !!r))]
    : me.restaurant ? [me.restaurant] : [];

  const [availability, shifts, published, shiftSlots, swapRequests, shiftPresets] = await Promise.all([
    prisma.availability.findMany({ where: { pin: { in: pins } } }),
    isStaff ? Promise.resolve([]) : prisma.shift.findMany({ where: { weekStart, pin: { in: schedPins } }, orderBy: { start: 'asc' } }),
    prisma.publishedSchedule.findMany({ where: { weekStart, restaurant: { in: restaurants } } }),
    isStaff ? Promise.resolve([]) : prisma.shiftSlot.findMany({ where: { restaurant: { in: restaurants } } }),
    prisma.swapRequest.findMany({
      where: isStaff
        ? { OR: [{ fromPin: me.pin }, { toPin: me.pin }] }
        : { OR: [{ fromPin: { in: pins } }, { toPin: { in: pins } }] },
    }),
    isStaff ? Promise.resolve([]) : prisma.shiftPreset.findMany({ where: { restaurant: { in: restaurants } } }),
  ]);

  // Shape users — passwords never leave the server; staff don't see wages or logins
  const usersMap: Record<number, object> = {};
  for (const u of users) {
    usersMap[u.pin] = {
      name: u.name, role: u.role, restaurant: u.restaurant,
      ...(u.position ? { position: u.position } : {}),
      ...(!isStaff && u.username ? { username: u.username } : {}),
      ...(!isStaff && u.password ? { hasPassword: true } : {}),
      ...(!isStaff && u.wage != null ? { wage: u.wage } : {}),
      ...(!isStaff && u.isMinor ? { isMinor: true } : {}),
    };
  }

  const availMap: Record<number, Record<string, object>> = {};
  for (const p of pins) {
    availMap[p] = {};
    for (const d of DAYS) availMap[p][d] = { unavailable: true, open: false, start: 9, end: 17 };
  }
  for (const a of availability) {
    availMap[a.pin][a.day] = { unavailable: a.unavailable, open: a.open, start: a.start, end: a.end };
  }

  const publishedMap: Record<string, PublishedWeek> = {};
  for (const p of published) {
    publishedMap[p.restaurant] = { publishedAt: p.publishedAt.toISOString(), snapshot: p.snapshot as unknown as Schedule };
  }

  // Staff see the published schedule; managers see the live draft
  let schedule: Schedule;
  if (isStaff) {
    schedule = shapeSchedule(schedPins, []);
    const snapshot = publishedMap[me.restaurant ?? '']?.snapshot ?? {};
    for (const p of schedPins) if (snapshot[p]) schedule[p] = { ...schedule[p], ...snapshot[p] };
  } else {
    schedule = shapeSchedule(schedPins, shifts);
  }

  const reqMap: Record<string, Record<string, Record<string, object[]>>> = {};
  for (const slot of shiftSlots) {
    reqMap[slot.restaurant] ??= {};
    reqMap[slot.restaurant][slot.day] ??= {};
    reqMap[slot.restaurant][slot.day][slot.position] ??= [];
    reqMap[slot.restaurant][slot.day][slot.position].push({ id: slot.id, start: slot.start, end: slot.end, count: slot.count });
  }

  const swapsMap: Record<string, object> = {};
  for (const r of swapRequests) {
    swapsMap[r.id] = { id: r.id, fromPin: r.fromPin, fromDay: r.fromDay, toPin: r.toPin, toDay: r.toDay, weekStart: r.weekStart, status: r.status };
  }

  const presetsMap: Record<string, object[]> = {};
  for (const p of shiftPresets) {
    (presetsMap[p.restaurant] ??= []).push({ id: p.id, name: p.name, start: p.start, end: p.end, ...(p.position ? { position: p.position } : {}) });
  }

  return NextResponse.json({
    users: usersMap, availability: availMap, schedule, published: publishedMap,
    shiftRequirements: reqMap, swapRequests: swapsMap, shiftPresets: presetsMap,
  });
});
