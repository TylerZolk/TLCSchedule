import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { HttpError, assertManages, requireUser, route } from '@/lib/auth';
import * as v from '@/lib/validate';

type IncomingShift = { s: unknown; e: unknown; position?: unknown };

/** Replaces a restaurant's whole week (used by Auto-Schedule and Clear). Returns the saved shifts with IDs. */
export const POST = route(async (req) => {
  const me   = await requireUser('manager', 'owner');
  const body = await req.json();
  const restaurant = v.restaurant(body.restaurant);
  const weekStart  = v.weekStart(body.weekStart);
  assertManages(me, restaurant);

  const staff = await prisma.user.findMany({ where: { restaurant, role: { in: ['employee', 'manager'] } }, select: { pin: true } });
  const pins  = staff.map((u) => u.pin);
  const incoming = (body.shifts ?? {}) as Record<string, Record<string, IncomingShift[]>>;

  const rows = Object.entries(incoming).flatMap(([pinStr, days]) => {
    const pin = Number(pinStr);
    if (!pins.includes(pin)) throw new HttpError(400, 'Shift for someone outside this restaurant.');
    return Object.entries(days ?? {}).flatMap(([day, list]) =>
      (list ?? []).map((sh) => ({
        pin, weekStart, day: v.day(day), start: v.hour(sh.s), end: v.hour(sh.e),
        position: v.position(restaurant, sh.position),
      }))
    );
  });

  const created = await prisma.$transaction(async (tx) => {
    await tx.shift.deleteMany({ where: { pin: { in: pins }, weekStart } });
    return tx.shift.createManyAndReturn({ data: rows });
  });

  return NextResponse.json({ schedule: v.shapeSchedule(pins, created) });
});
