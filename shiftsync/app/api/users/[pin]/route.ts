import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ pin: string }> }) {
  const { pin: pinStr } = await params;
  const origPin = parseInt(pinStr);
  const { pin: newPin, name, role, restaurant, position, username, password, wage, isMinor } = await req.json();

  if (newPin !== origPin) {
    await prisma.$transaction([
      prisma.user.create({ data: { pin: newPin, name, role, restaurant: restaurant ?? null, position: position ?? null, username: username ?? null, password: password ?? null, wage: wage ?? null, isMinor: isMinor ?? false } }),
      prisma.availability.updateMany({ where: { pin: origPin }, data: { pin: newPin } }),
      prisma.shift.updateMany({ where: { pin: origPin }, data: { pin: newPin } }),
      prisma.user.delete({ where: { pin: origPin } }),
    ]);
  } else {
    await prisma.user.update({ where: { pin: origPin }, data: { name, role, restaurant: restaurant ?? null, position: position ?? null, username: username ?? null, password: password ?? null, wage: wage ?? null, isMinor: isMinor ?? false } });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ pin: string }> }) {
  const { pin: pinStr } = await params;
  await prisma.user.delete({ where: { pin: parseInt(pinStr) } });
  return NextResponse.json({ ok: true });
}
