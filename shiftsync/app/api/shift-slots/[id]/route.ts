import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { HttpError, assertManages, requireUser, route } from '@/lib/auth';
import * as v from '@/lib/validate';

type Ctx = { params: Promise<{ id: string }> };

async function loadSlot(id: string) {
  const slot = await prisma.shiftSlot.findUnique({ where: { id } });
  if (!slot) throw new HttpError(404, 'That shift no longer exists.');
  return slot;
}

export const PUT = route<Ctx>(async (req, { params }) => {
  const me   = await requireUser('manager', 'owner');
  const slot = await loadSlot((await params).id);
  assertManages(me, slot.restaurant);
  const { field, value } = await req.json();
  let data: { start?: number; end?: number; count?: number };
  if (field === 'start' || field === 'end') data = { [field]: v.hour(value) };
  else if (field === 'count' && Number.isInteger(value) && value >= 1 && value <= 50) data = { count: value };
  else throw new HttpError(400, 'Invalid update.');
  await prisma.shiftSlot.update({ where: { id: slot.id }, data });
  return NextResponse.json({ ok: true });
});

export const DELETE = route<Ctx>(async (_req, { params }) => {
  const me   = await requireUser('manager', 'owner');
  const slot = await loadSlot((await params).id);
  assertManages(me, slot.restaurant);
  await prisma.shiftSlot.delete({ where: { id: slot.id } });
  return NextResponse.json({ ok: true });
});
