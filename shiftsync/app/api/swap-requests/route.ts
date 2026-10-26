import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/db';
import { HttpError, requireUser, route } from '@/lib/auth';
import * as v from '@/lib/validate';

export const POST = route(async (req) => {
  const me   = await requireUser('employee');
  const body = await req.json();
  const toPin = v.pin(body.toPin);
  const colleague = await prisma.user.findUnique({ where: { pin: toPin } });
  if (!colleague || colleague.pin === me.pin || colleague.restaurant !== me.restaurant) {
    throw new HttpError(400, 'You can only swap with someone at your restaurant.');
  }
  const r = await prisma.swapRequest.create({
    data: { id: randomUUID(), fromPin: me.pin, fromDay: v.day(body.fromDay), toPin, toDay: v.day(body.toDay), weekStart: v.weekStart(body.weekStart), status: 'pending' },
  });
  return NextResponse.json({ id: r.id, fromPin: r.fromPin, fromDay: r.fromDay, toPin: r.toPin, toDay: r.toDay, weekStart: r.weekStart, status: r.status });
});
