import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { id, restaurant, day, position, start, end, count } = await req.json();
  const slot = await prisma.shiftSlot.create({ data: { id, restaurant, day, position, start, end, count } });
  return NextResponse.json(slot);
}
