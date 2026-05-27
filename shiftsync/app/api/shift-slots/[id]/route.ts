import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { field, value } = await req.json();
  await prisma.shiftSlot.update({ where: { id }, data: { [field]: value } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.shiftSlot.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
