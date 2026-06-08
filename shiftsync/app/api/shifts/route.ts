import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { pin, day, start, end, position, weekStart } = await req.json();
  const shift = await prisma.shift.create({
    data: { pin, day, start, end, position: position ?? null, weekStart: weekStart ?? '' },
  });
  return NextResponse.json({ id: shift.id });
}
