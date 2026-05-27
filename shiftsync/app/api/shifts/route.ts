import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Upsert or delete a shift
export async function PUT(req: NextRequest) {
  const { pin, day, shift } = await req.json();
  if (shift === null) {
    await prisma.shift.deleteMany({ where: { pin, day } });
  } else {
    await prisma.shift.upsert({
      where: { pin_day: { pin, day } },
      create: { pin, day, start: shift.s, end: shift.e, position: shift.position ?? null },
      update: { start: shift.s, end: shift.e, position: shift.position ?? null },
    });
  }
  return NextResponse.json({ ok: true });
}
