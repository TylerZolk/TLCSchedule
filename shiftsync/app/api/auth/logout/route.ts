import { NextResponse } from 'next/server';
import { destroySession, route } from '@/lib/auth';

export const POST = route(async () => {
  await destroySession();
  return NextResponse.json({ ok: true });
});
