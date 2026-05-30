import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { DAYS } from '@/lib/constants';

export async function GET() {
  const [users, availability, shifts, shiftSlots, swapRequests, publishedAts, shiftPresets] = await Promise.all([
    prisma.user.findMany(),
    prisma.availability.findMany(),
    prisma.shift.findMany(),
    prisma.shiftSlot.findMany(),
    prisma.swapRequest.findMany(),
    prisma.publishedAt.findMany(),
    prisma.shiftPreset.findMany(),
  ]);

  // Shape users
  const usersMap: Record<number, object> = {};
  for (const u of users) {
    usersMap[u.pin] = {
      name: u.name, role: u.role, restaurant: u.restaurant,
      ...(u.position  ? { position: u.position }   : {}),
      ...(u.username  ? { username: u.username }    : {}),
      ...(u.password  ? { password: u.password }    : {}),
      ...(u.wage      ? { wage: u.wage }             : {}),
      ...(u.isMinor   ? { isMinor: true }            : {}),
    };
  }

  // Shape availability
  const availMap: Record<number, Record<string, object>> = {};
  for (const u of users) {
    availMap[u.pin] = {};
    for (const d of DAYS) availMap[u.pin][d] = { unavailable: true, open: false, start: 9, end: 17 };
  }
  for (const a of availability) {
    if (availMap[a.pin]) availMap[a.pin][a.day] = { unavailable: a.unavailable, open: a.open, start: a.start, end: a.end };
  }

  // Shape schedule — multiple shifts per day as array
  const scheduleMap: Record<number, Record<string, object[]>> = {};
  for (const u of users) {
    if (u.role === 'employee' || u.role === 'manager') {
      scheduleMap[u.pin] = {};
      for (const d of DAYS) scheduleMap[u.pin][d] = [];
    }
  }
  for (const s of shifts) {
    if (scheduleMap[s.pin]) {
      scheduleMap[s.pin][s.day] = [
        ...(scheduleMap[s.pin][s.day] ?? []),
        { id: s.id, s: s.start, e: s.end, ...(s.position ? { position: s.position } : {}) },
      ];
    }
  }

  // Shape shift requirements
  const reqMap: Record<string, Record<string, Record<string, object[]>>> = {};
  for (const slot of shiftSlots) {
    if (!reqMap[slot.restaurant]) reqMap[slot.restaurant] = {};
    if (!reqMap[slot.restaurant][slot.day]) reqMap[slot.restaurant][slot.day] = {};
    if (!reqMap[slot.restaurant][slot.day][slot.position]) reqMap[slot.restaurant][slot.day][slot.position] = [];
    reqMap[slot.restaurant][slot.day][slot.position].push({
      id: slot.id, start: slot.start, end: slot.end, count: slot.count,
    });
  }

  // Shape swap requests
  const swapsMap: Record<string, object> = {};
  for (const r of swapRequests) {
    swapsMap[r.id] = { id: r.id, fromPin: r.fromPin, fromDay: r.fromDay, toPin: r.toPin, toDay: r.toDay, status: r.status };
  }

  // Shape publishedAt
  const publishedAtMap: Record<string, string> = {};
  for (const p of publishedAts) publishedAtMap[p.restaurant] = p.publishedAt.toISOString();

  const presetsMap: Record<string, object[]> = {};
  for (const p of shiftPresets) {
    if (!presetsMap[p.restaurant]) presetsMap[p.restaurant] = [];
    presetsMap[p.restaurant].push({ id: p.id, name: p.name, start: p.start, end: p.end, ...(p.position ? { position: p.position } : {}) });
  }

  return NextResponse.json({ users: usersMap, availability: availMap, schedule: scheduleMap, shiftRequirements: reqMap, swapRequests: swapsMap, publishedAt: publishedAtMap, shiftPresets: presetsMap });
}
