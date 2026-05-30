import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status, swapShifts } = await req.json();

  if (swapShifts) {
    const swapReq = await prisma.swapRequest.findUnique({ where: { id } });
    if (swapReq) {
      const fromShifts = await prisma.shift.findMany({ where: { pin: swapReq.fromPin, day: swapReq.fromDay } });
      const toShifts   = await prisma.shift.findMany({ where: { pin: swapReq.toPin,   day: swapReq.toDay   } });

      await prisma.$transaction([
        prisma.shift.deleteMany({ where: { OR: [
          { pin: swapReq.fromPin, day: swapReq.fromDay },
          { pin: swapReq.toPin,   day: swapReq.toDay   },
        ]}}),
        ...toShifts.map((sh) =>
          prisma.shift.create({ data: { pin: swapReq.fromPin, day: swapReq.fromDay, start: sh.start, end: sh.end, position: sh.position } })
        ),
        ...fromShifts.map((sh) =>
          prisma.shift.create({ data: { pin: swapReq.toPin, day: swapReq.toDay, start: sh.start, end: sh.end, position: sh.position } })
        ),
        prisma.swapRequest.update({ where: { id }, data: { status } }),
      ]);
      return NextResponse.json({ ok: true });
    }
  }

  await prisma.swapRequest.update({ where: { id }, data: { status } });
  return NextResponse.json({ ok: true });
}
