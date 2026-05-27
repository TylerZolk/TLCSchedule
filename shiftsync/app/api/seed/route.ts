import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { INITIAL_USERS, DAYS } from '@/lib/constants';

export async function POST() {
  const count = await prisma.user.count();
  if (count > 0) return NextResponse.json({ message: 'Already seeded' });

  for (const [pinStr, u] of Object.entries(INITIAL_USERS)) {
    const pin = Number(pinStr);
    await prisma.user.create({
      data: {
        pin,
        name: u.name,
        role: u.role,
        restaurant: u.restaurant ?? null,
        position: u.position ?? null,
        username: u.username ?? null,
        password: u.password ?? null,
        wage: null,
        isMinor: false,
      },
    });
    await prisma.availability.createMany({
      data: DAYS.map((d) => ({ pin, day: d, unavailable: false, start: 9, end: 17 })),
    });
  }

  return NextResponse.json({ message: 'Seeded successfully' });
}
