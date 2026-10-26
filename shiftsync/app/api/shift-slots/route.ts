import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/db';
import { HttpError, assertManages, requireUser, route } from '@/lib/auth';
import * as v from '@/lib/validate';

export const POST = route(async (req) => {
  const me   = await requireUser('manager', 'owner');
  const body = await req.json();
  const restaurant = v.restaurant(body.restaurant);
  assertManages(me, restaurant);
  const position = v.position(restaurant, body.position);
  if (!position) throw new HttpError(400, 'Position is required.');
  const slot = await prisma.shiftSlot.create({
    data: { id: randomUUID(), restaurant, day: v.day(body.day), position, start: v.hour(body.start), end: v.hour(body.end), count: 1 },
  });
  return NextResponse.json({ id: slot.id, start: slot.start, end: slot.end, count: slot.count });
});
