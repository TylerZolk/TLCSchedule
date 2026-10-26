import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { HttpError, assertManages, requireUser, route } from '@/lib/auth';
import { staffFields } from '../fields';

type Ctx = { params: Promise<{ pin: string }> };

async function loadTarget(pinStr: string) {
  const pin = Number(pinStr);
  const user = Number.isInteger(pin) ? await prisma.user.findUnique({ where: { pin } }) : null;
  if (!user) throw new HttpError(404, 'Staff member not found.');
  if (user.role === 'owner') throw new HttpError(403, 'The owner account cannot be changed here.');
  return user;
}

export const PUT = route<Ctx>(async (req, { params }) => {
  const me     = await requireUser('manager', 'owner');
  const target = await loadTarget((await params).pin);
  assertManages(me, target.restaurant);
  const data = await staffFields(me, await req.json(), target);
  // Changing the PIN cascades to shifts, availability, swaps and sessions in the database
  await prisma.user.update({ where: { pin: target.pin }, data });
  return NextResponse.json({ ok: true });
});

export const DELETE = route<Ctx>(async (_req, { params }) => {
  const me     = await requireUser('manager', 'owner');
  const target = await loadTarget((await params).pin);
  assertManages(me, target.restaurant);
  if (target.pin === me.pin) throw new HttpError(400, "You can't remove yourself.");
  // Shifts, availability, swap requests and sessions are removed with the user
  await prisma.user.delete({ where: { pin: target.pin } });
  return NextResponse.json({ ok: true });
});
