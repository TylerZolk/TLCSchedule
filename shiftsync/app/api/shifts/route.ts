import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { assertManagesPin, requireUser, route } from '@/lib/auth';
import * as v from '@/lib/validate';

export const POST = route(async (req) => {
  const me   = await requireUser('manager', 'owner');
  const body = await req.json();
  const pin  = v.pin(body.pin);
  const target = await assertManagesPin(me, pin);
  const shift = await prisma.shift.create({
    data: {
      pin, day: v.day(body.day), start: v.hour(body.start), end: v.hour(body.end),
      position: v.position(target.restaurant, body.position), weekStart: v.weekStart(body.weekStart),
    },
  });
  return NextResponse.json({ id: shift.id });
});
