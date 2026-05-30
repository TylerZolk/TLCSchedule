import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { restaurant, name, start, end, position } = await req.json();
  const preset = await prisma.shiftPreset.create({
    data: { restaurant, name, start, end, position: position ?? null },
  });
  return NextResponse.json(preset);
}
