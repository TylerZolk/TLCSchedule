import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { Prisma, User } from '@prisma/client';
import { prisma } from '@/lib/db';

const SESSION_COOKIE = 'shiftsync_session';
const SESSION_HOURS  = 12;

// ─── Passwords ────────────────────────────────────────────────────────────────

function scryptAsync(password: string, salt: Buffer, keylen: number): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scrypt(password, salt, keylen, (err, key) => (err ? reject(err) : resolve(key)))
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, 64);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export const isHashed = (stored: string) => stored.startsWith('scrypt$');

/** Accepts both hashed and legacy plaintext passwords (the latter are re-hashed on login). */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (!isHashed(stored)) {
    const a = Buffer.from(password);
    const b = Buffer.from(stored);
    return a.length === b.length && timingSafeEqual(a, b);
  }
  const [, saltHex, hashHex] = stored.split('$');
  const expected = Buffer.from(hashHex, 'hex');
  const actual   = await scryptAsync(password, Buffer.from(saltHex, 'hex'), expected.length);
  return timingSafeEqual(actual, expected);
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export async function createSession(pin: number) {
  const token     = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 3600_000);
  await prisma.session.create({ data: { token, pin, expiresAt } });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar   = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await prisma.session.deleteMany({ where: { token } });
  jar.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<User | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({ where: { token }, include: { user: true } });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session.deleteMany({ where: { token } });
    return null;
  }
  return session.user;
}

// ─── Authorization ────────────────────────────────────────────────────────────

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function requireUser(...roles: string[]): Promise<User> {
  const user = await getSessionUser();
  if (!user) throw new HttpError(401, 'Your session has expired. Please sign in again.');
  if (roles.length && !roles.includes(user.role)) throw new HttpError(403, 'You do not have permission to do that.');
  return user;
}

export function canManage(user: User, restaurant: string | null | undefined): boolean {
  if (user.role === 'owner') return true;
  return user.role === 'manager' && !!restaurant && user.restaurant === restaurant;
}

export function assertManages(user: User, restaurant: string | null | undefined) {
  if (!canManage(user, restaurant)) throw new HttpError(403, 'You can only manage your own restaurant.');
}

/** Loads the user who owns `pin` and checks the caller manages their restaurant. */
export async function assertManagesPin(user: User, pin: number): Promise<User> {
  const target = await prisma.user.findUnique({ where: { pin } });
  if (!target) throw new HttpError(404, 'Staff member not found.');
  assertManages(user, target.restaurant);
  return target;
}

// ─── Rate limiting (best effort: per server instance) ─────────────────────────
// Only failures count, so a shared tablet with many good sign-ins is never locked out.

const failures = new Map<string, { count: number; resetAt: number }>();
const MAX_FAILURES = 10;
const WINDOW_MS    = 15 * 60_000;

const clientIp = (req: NextRequest) => req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';

export function checkLoginRateLimit(req: NextRequest) {
  const entry = failures.get(clientIp(req));
  if (entry && entry.resetAt > Date.now() && entry.count >= MAX_FAILURES) {
    throw new HttpError(429, 'Too many failed attempts. Try again in a few minutes.');
  }
}

export function recordLoginFailure(req: NextRequest) {
  const ip  = clientIp(req);
  const now = Date.now();
  const entry = failures.get(ip);
  if (!entry || entry.resetAt < now) failures.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  else entry.count++;
}

// ─── Route wrapper ────────────────────────────────────────────────────────────

/** Turns thrown HttpErrors and common Prisma errors into JSON error responses. */
export function route<C>(handler: (req: NextRequest, ctx: C) => Promise<Response>) {
  return async (req: NextRequest, ctx: C): Promise<Response> => {
    try {
      return await handler(req, ctx);
    } catch (e) {
      if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2025') return NextResponse.json({ error: 'That record no longer exists.' }, { status: 404 });
        if (e.code === 'P2002') {
          const target = String((e.meta?.target as string[] | undefined)?.join(',') ?? '');
          const msg = target.includes('username') ? 'Username already in use.' : target.includes('pin') ? 'PIN already in use.' : 'That already exists.';
          return NextResponse.json({ error: msg }, { status: 409 });
        }
      }
      console.error(e);
      return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
    }
  };
}
