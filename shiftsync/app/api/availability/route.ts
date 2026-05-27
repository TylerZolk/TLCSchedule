import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PUT(req: NextRequest) {
  const { pin, day, field, value } = await req.json();
  await prisma.availability.upsert({
    where: { pin_day: { pin, day } },
    create: { pin, day, [field]: value },
    update: { [field]: value },
  });
  return NextResponse.json({ ok: true });
}
