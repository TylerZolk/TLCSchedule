import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PUT(req: NextRequest) {
  const { pin, day, field, value } = await req.json();
  await prisma.availability.upsert({
    where: { pin_day: { pin, day } },
    create: { pin, day, unavailable: true, open: false, start: 9, end: 17, [field]: value },
    update: { [field]: value },
  });
  return NextResponse.json({ ok: true });
}
