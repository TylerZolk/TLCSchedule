import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { DAYS } from '@/lib/constants';

export async function POST(req: NextRequest) {
  const { pin, name, role, restaurant, position, username, password, wage, isMinor } = await req.json();
  const user = await prisma.user.create({
    data: { pin, name, role, restaurant: restaurant ?? null, position: position ?? null, username: username ?? null, password: password ?? null, wage: wage ?? null, isMinor: isMinor ?? false },
  });
  // Seed default availability
  await prisma.availability.createMany({
    data: DAYS.map((d) => ({ pin, day: d, unavailable: false, start: 9, end: 17 })),
  });
  return NextResponse.json(user);
}
