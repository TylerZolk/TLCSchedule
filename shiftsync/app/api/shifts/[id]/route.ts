import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { HttpError, assertManagesPin, requireUser, route } from '@/lib/auth';
import * as v from '@/lib/validate';

type Ctx = { params: Promise<{ id: string }> };

async function loadShift(idStr: string) {
  const id = Number(idStr);
  const shift = Number.isInteger(id) ? await prisma.shift.findUnique({ where: { id } }) : null;
  if (!shift) throw new HttpError(404, 'That shift no longer exists.');
  return shift;
}

export const PUT = route<Ctx>(async (req, { params }) => {
  const me    = await requireUser('manager', 'owner');
  const shift = await loadShift((await params).id);
  const target = await assertManagesPin(me, shift.pin);
  const body = await req.json();
  const data: { start?: number; end?: number; position?: string | null } = {};
  if (body.start    !== undefined) data.start    = v.hour(body.start);
  if (body.end      !== undefined) data.end      = v.hour(body.end);
  if (body.position !== undefined) data.position = v.position(target.restaurant, body.position);
  await prisma.shift.update({ where: { id: shift.id }, data });
  return NextResponse.json({ ok: true });
});

export const DELETE = route<Ctx>(async (_req, { params }) => {
  const me    = await requireUser('manager', 'owner');
  const shift = await loadShift((await params).id);
  await assertManagesPin(me, shift.pin);
  await prisma.shift.delete({ where: { id: shift.id } });
  return NextResponse.json({ ok: true });
});
