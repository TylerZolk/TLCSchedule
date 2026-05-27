import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Bulk replace shifts for a set of pins — used by auto-schedule and clear
export async function POST(req: NextRequest) {
  const { pins, shifts } = await req.json();
  // shifts: Record<number, Record<string, {s,e,position}|null>>

  await prisma.$transaction([
    prisma.shift.deleteMany({ where: { pin: { in: pins } } }),
    ...Object.entries(shifts).flatMap(([pinStr, days]) =>
      Object.entries(days as Record<string, { s: number; e: number; position?: string } | null>)
        .filter(([, sh]) => sh !== null)
        .map(([day, sh]) =>
          prisma.shift.create({
            data: { pin: Number(pinStr), day, start: sh!.s, end: sh!.e, position: sh!.position ?? null },
          })
        )
    ),
  ]);

  return NextResponse.json({ ok: true });
}
