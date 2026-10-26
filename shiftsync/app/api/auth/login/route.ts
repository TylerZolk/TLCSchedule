import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { HttpError, checkLoginRateLimit, createSession, hashPassword, isHashed, recordLoginFailure, route, verifyPassword } from '@/lib/auth';
import { sessionUserJson } from '../session-user';

export const POST = route(async (req) => {
  checkLoginRateLimit(req);
  const { username, password } = await req.json();
  if (typeof username !== 'string' || typeof password !== 'string') throw new HttpError(400, 'Username and password are required.');

  const user = await prisma.user.findFirst({
    where: { username: { equals: username.trim(), mode: 'insensitive' }, role: { in: ['manager', 'owner'] } },
  });
  if (!user?.password || !(await verifyPassword(password, user.password))) {
    recordLoginFailure(req);
    throw new HttpError(401, 'Invalid username or password.');
  }
  // Upgrade passwords saved before hashing was added
  if (!isHashed(user.password)) {
    await prisma.user.update({ where: { pin: user.pin }, data: { password: await hashPassword(password) } });
  }
  await createSession(user.pin);
  return NextResponse.json({ user: sessionUserJson(user) });
});
