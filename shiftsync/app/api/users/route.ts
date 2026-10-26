import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser, route } from '@/lib/auth';
import { DEFAULT_AVAILABILITY, staffFields } from './fields';

export const POST = route(async (req) => {
  const me   = await requireUser('manager', 'owner');
  const data = await staffFields(me, await req.json());
  await prisma.user.create({ data: { ...data, availability: { create: DEFAULT_AVAILABILITY } } });
  return NextResponse.json({ ok: true });
});
