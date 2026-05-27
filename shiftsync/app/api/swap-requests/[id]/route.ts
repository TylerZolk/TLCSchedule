import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status, swapShifts } = await req.json();

  if (swapShifts) {
    const swapReq = await prisma.swapRequest.findUnique({ where: { id } });
    if (swapReq) {
      const fromShift = await prisma.shift.findUnique({ where: { pin_day: { pin: swapReq.fromPin, day: swapReq.fromDay } } });
      const toShift   = await prisma.shift.findUnique({ where: { pin_day: { pin: swapReq.toPin,   day: swapReq.toDay   } } });

      await prisma.$transaction([
        // Delete both sides
        prisma.shift.deleteMany({ where: { OR: [{ pin: swapReq.fromPin, day: swapReq.fromDay }, { pin: swapReq.toPin, day: swapReq.toDay }] } }),
        // Re-create swapped
        ...(toShift   ? [prisma.shift.create({ data: { pin: swapReq.fromPin, day: swapReq.fromDay, start: toShift.start,   end: toShift.end,   position: toShift.position   ?? null } })] : []),
        ...(fromShift ? [prisma.shift.create({ data: { pin: swapReq.toPin,   day: swapReq.toDay,   start: fromShift.start, end: fromShift.end, position: fromShift.position ?? null } })] : []),
        prisma.swapRequest.update({ where: { id }, data: { status } }),
      ]);
      return NextResponse.json({ ok: true });
    }
  }

  await prisma.swapRequest.update({ where: { id }, data: { status } });
  return NextResponse.json({ ok: true });
}
