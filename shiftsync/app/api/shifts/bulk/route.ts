import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { pins, shifts } = await req.json();

  await prisma.$transaction([
    prisma.shift.deleteMany({ where: { pin: { in: pins } } }),
    ...Object.entries(shifts as Record<string, Record<string, Array<{ s: number; e: number; position?: string }>>>)
      .flatMap(([pinStr, days]) =>
        Object.entries(days).flatMap(([day, dayShifts]) =>
          (dayShifts ?? []).map((sh) =>
            prisma.shift.create({
              data: { pin: Number(pinStr), day, start: sh.s, end: sh.e, position: sh.position ?? null },
            })
          )
        )
      ),
  ]);

  return NextResponse.json({ ok: true });
}
