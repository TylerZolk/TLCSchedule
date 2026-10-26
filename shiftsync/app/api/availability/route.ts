import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { HttpError, assertManagesPin, requireUser, route } from '@/lib/auth';
import * as v from '@/lib/validate';

export const PUT = route(async (req) => {
  const me   = await requireUser();
  const body = await req.json();
  const pin  = v.pin(body.pin);
  const day  = v.day(body.day);
  if (pin !== me.pin) await assertManagesPin(me, pin);

  const data: { unavailable?: boolean; open?: boolean; start?: number; end?: number } = {};
  if (body.unavailable !== undefined) data.unavailable = !!body.unavailable;
  if (body.open        !== undefined) data.open        = !!body.open;
  if (body.start       !== undefined) data.start       = v.hour(body.start);
  if (body.end         !== undefined) data.end         = v.hour(body.end);
  if (Object.keys(data).length === 0) throw new HttpError(400, 'Nothing to update.');

  await prisma.availability.upsert({
    where: { pin_day: { pin, day } },
    create: { pin, day, unavailable: true, open: false, start: 9, end: 17, ...data },
    update: data,
  });
  return NextResponse.json({ ok: true });
});
