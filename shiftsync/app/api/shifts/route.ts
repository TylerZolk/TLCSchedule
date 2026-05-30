import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { pin, day, start, end, position } = await req.json();
  const shift = await prisma.shift.create({
    data: { pin, day, start, end, position: position ?? null },
  });
  return NextResponse.json({ id: shift.id });
}
