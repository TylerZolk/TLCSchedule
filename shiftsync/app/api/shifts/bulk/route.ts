import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { pins, shifts, weekStart } = await req.json();
  const ws: string = weekStart ?? '';

  await prisma.$transaction([
    prisma.shift.deleteMany({ where: { pin: { in: pins }, weekStart: ws } }),
    ...Object.entries(shifts as Record<string, Record<string, Array<{ s: number; e: number; position?: string }>>>)
      .flatMap(([pinStr, days]) =>
        Object.entries(days).flatMap(([day, dayShifts]) =>
          (dayShifts ?? []).map((sh) =>
            prisma.shift.create({
              data: { pin: Number(pinStr), day, start: sh.s, end: sh.e, position: sh.position ?? null, weekStart: ws },
            })
          )
        )
      ),
  ]);

  return NextResponse.json({ ok: true });
}
