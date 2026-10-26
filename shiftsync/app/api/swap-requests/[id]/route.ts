import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { HttpError, canManage, requireUser, route } from '@/lib/auth';
import * as v from '@/lib/validate';
import { Schedule } from '@/types';

type Action = 'accept' | 'decline' | 'approve' | 'deny';

export const PUT = route<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  const me = await requireUser();
  const { id } = await params;
  const body = await req.json();
  const action = body.action as Action;

  const swap = await prisma.swapRequest.findUnique({ where: { id }, include: { fromUser: true, toUser: true } });
  if (!swap) throw new HttpError(404, 'That swap request no longer exists.');

  // The colleague accepts or declines; then a manager approves or denies
  if (action === 'accept' || action === 'decline') {
    if (me.pin !== swap.toPin) throw new HttpError(403, 'This request was not sent to you.');
    if (swap.status !== 'pending') throw new HttpError(409, 'This request was already answered.');
    const status = action === 'accept' ? 'awaiting_approval' : 'declined';
    await prisma.swapRequest.update({ where: { id }, data: { status } });
    return NextResponse.json({ status });
  }
  if (action !== 'approve' && action !== 'deny') throw new HttpError(400, 'Invalid action.');
  if (!canManage(me, swap.fromUser.restaurant) && !canManage(me, swap.toUser.restaurant)) {
    throw new HttpError(403, 'You can only approve swaps at your restaurant.');
  }
  if (swap.status !== 'awaiting_approval') throw new HttpError(409, 'This request is not waiting for approval.');
  if (action === 'deny') {
    await prisma.swapRequest.update({ where: { id }, data: { status: 'declined' } });
    return NextResponse.json({ status: 'declined' });
  }

  // Requests made before swaps were tied to a week use the week the manager is viewing
  const weekStart = swap.weekStart || v.weekStart(body.weekStart);
  const from = { pin: swap.fromPin, day: swap.fromDay, weekStart };
  const to   = { pin: swap.toPin,   day: swap.toDay,   weekStart };

  // Each shift changes hands and keeps its day: the requester takes the colleague's
  // toDay shift(s) and the colleague takes the requester's fromDay shift(s)
  await prisma.$transaction(async (tx) => {
    const fromIds = (await tx.shift.findMany({ where: from, select: { id: true } })).map((s) => s.id);
    const toIds   = (await tx.shift.findMany({ where: to,   select: { id: true } })).map((s) => s.id);
    await tx.shift.updateMany({ where: { id: { in: fromIds } }, data: { pin: to.pin } });
    await tx.shift.updateMany({ where: { id: { in: toIds } },   data: { pin: from.pin } });

    // Keep what employees see in step with the swap
    const restaurants = [...new Set([swap.fromUser.restaurant, swap.toUser.restaurant].filter((r): r is string => !!r))];
    for (const restaurant of restaurants) {
      const pub = await tx.publishedSchedule.findUnique({ where: { restaurant_weekStart: { restaurant, weekStart } } });
      if (!pub) continue;
      const snap = pub.snapshot as unknown as Schedule;
      if (!snap[from.pin] || !snap[to.pin]) continue;
      const fromPub = snap[from.pin][from.day] ?? [];
      const toPub   = snap[to.pin][to.day] ?? [];
      snap[from.pin][from.day] = [];
      snap[to.pin][to.day]     = [];
      snap[from.pin][to.day] = [...(snap[from.pin][to.day] ?? []), ...toPub];
      snap[to.pin][from.day] = [...(snap[to.pin][from.day] ?? []), ...fromPub];
      await tx.publishedSchedule.update({
        where: { restaurant_weekStart: { restaurant, weekStart } },
        data: { snapshot: snap as unknown as Prisma.InputJsonValue },
      });
    }

    await tx.swapRequest.update({ where: { id }, data: { status: 'accepted', weekStart } });
  });

  return NextResponse.json({ status: 'accepted' });
});
