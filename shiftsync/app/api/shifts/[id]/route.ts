import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.start !== undefined) data.start = body.start;
  if (body.end   !== undefined) data.end   = body.end;
  if (body.position !== undefined) data.position = body.position;
  await prisma.shift.update({ where: { id: parseInt(id) }, data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.shift.delete({ where: { id: parseInt(id) } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
