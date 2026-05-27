import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { restaurant } = await req.json();
  await prisma.publishedAt.upsert({
    where: { restaurant },
    create: { restaurant, publishedAt: new Date() },
    update: { publishedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
