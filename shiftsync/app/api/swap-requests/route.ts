import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { id, fromPin, fromDay, toPin, toDay } = await req.json();
  const req_ = await prisma.swapRequest.create({ data: { id, fromPin, fromDay, toPin, toDay, status: 'pending' } });
  return NextResponse.json(req_);
}
