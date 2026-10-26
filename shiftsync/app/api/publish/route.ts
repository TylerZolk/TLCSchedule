import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { assertManages, requireUser, route } from '@/lib/auth';
import * as v from '@/lib/validate';

/** Freezes the current draft for one restaurant + week; this is what employees see. */
export const POST = route(async (req) => {
  const me   = await requireUser('manager', 'owner');
  const body = await req.json();
  const restaurant = v.restaurant(body.restaurant);
  const weekStart  = v.weekStart(body.weekStart);
  assertManages(me, restaurant);

  const staff  = await prisma.user.findMany({ where: { restaurant, role: { in: ['employee', 'manager'] } }, select: { pin: true } });
  const pins   = staff.map((u) => u.pin);
  const shifts = await prisma.shift.findMany({ where: { weekStart, pin: { in: pins } }, orderBy: { start: 'asc' } });
  const snapshot = v.shapeSchedule(pins, shifts);

  const row = await prisma.publishedSchedule.upsert({
    where: { restaurant_weekStart: { restaurant, weekStart } },
    create: { restaurant, weekStart, snapshot: snapshot as unknown as Prisma.InputJsonValue },
    update: { snapshot: snapshot as unknown as Prisma.InputJsonValue, publishedAt: new Date() },
  });
  return NextResponse.json({ publishedAt: row.publishedAt.toISOString(), snapshot });
});
