import { NextResponse } from 'next/server';
import { requireUser, route } from '@/lib/auth';
import { sessionUserJson } from '../session-user';

export const GET = route(async () => {
  const user = await requireUser();
  return NextResponse.json({ user: sessionUserJson(user) });
});
