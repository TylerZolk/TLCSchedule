import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { HttpError, checkLoginRateLimit, createSession, recordLoginFailure, route } from '@/lib/auth';
import { sessionUserJson } from '../session-user';

export const POST = route(async (req) => {
  checkLoginRateLimit(req);
  const { pin } = await req.json();
  const n = Number(pin);
  const user = Number.isInteger(n) ? await prisma.user.findUnique({ where: { pin: n } }) : null;
  if (!user || user.role !== 'employee') {
    recordLoginFailure(req);
    throw new HttpError(401, 'Invalid employee PIN. Please try again.');
  }
  await createSession(user.pin);
  return NextResponse.json({ user: sessionUserJson(user) });
});
