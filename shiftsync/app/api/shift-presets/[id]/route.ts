import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { HttpError, assertManages, requireUser, route } from '@/lib/auth';

export const DELETE = route<{ params: Promise<{ id: string }> }>(async (_req, { params }) => {
  const me = await requireUser('manager', 'owner');
  const id = Number((await params).id);
  const preset = Number.isInteger(id) ? await prisma.shiftPreset.findUnique({ where: { id } }) : null;
  if (!preset) throw new HttpError(404, 'That preset no longer exists.');
  assertManages(me, preset.restaurant);
  await prisma.shiftPreset.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});
