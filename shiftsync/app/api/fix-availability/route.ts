import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// One-time fix: set all existing availability rows to unavailable=true
export async function POST() {
  const result = await prisma.availability.updateMany({
    where: { unavailable: false, open: false },
    data: { unavailable: true },
  });
  return NextResponse.json({ updated: result.count });
}
