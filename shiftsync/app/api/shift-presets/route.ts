import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { assertManages, requireUser, route } from '@/lib/auth';
import * as v from '@/lib/validate';

export const POST = route(async (req) => {
  const me   = await requireUser('manager', 'owner');
  const body = await req.json();
  const restaurant = v.restaurant(body.restaurant);
  assertManages(me, restaurant);
  const preset = await prisma.shiftPreset.create({
    data: { restaurant, name: v.str(body.name, 'Name', 40), start: v.hour(body.start), end: v.hour(body.end), position: v.position(restaurant, body.position) },
  });
  return NextResponse.json(preset);
});
