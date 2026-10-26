import { User } from '@prisma/client';
import { HttpError, assertManages, hashPassword } from '@/lib/auth';
import { DAYS } from '@/lib/constants';
import { prisma } from '@/lib/db';
import * as v from '@/lib/validate';

/** Validates the staff form shared by create and edit. `existing` is the user being edited. */
export async function staffFields(me: User, body: Record<string, unknown>, existing?: User) {
  const role = body.role;
  if (role !== 'employee' && role !== 'manager') throw new HttpError(400, 'Role must be employee or manager.');
  const restaurant = v.restaurant(body.restaurant);
  assertManages(me, restaurant);

  const wage = body.wage == null || body.wage === '' ? null : Number(body.wage);
  if (wage !== null && (!Number.isFinite(wage) || wage < 0 || wage > 1000)) throw new HttpError(400, 'Invalid wage.');

  let username: string | null = null;
  let password: string | null = null;
  if (role === 'manager') {
    username = v.str(body.username, 'Username', 30);
    // The database index is case-sensitive but sign-in isn't
    const clash = await prisma.user.findFirst({
      where: { username: { equals: username, mode: 'insensitive' }, ...(existing ? { NOT: { pin: existing.pin } } : {}) },
    });
    if (clash) throw new HttpError(409, 'Username already in use.');
    const newPassword = typeof body.password === 'string' ? body.password.trim() : '';
    if (newPassword) password = await hashPassword(newPassword);
    else if (existing?.password) password = existing.password; // blank = keep current
    else throw new HttpError(400, 'Password is required for managers.');
  }

  return {
    pin: v.pin(body.pin),
    name: v.str(body.name, 'Name', 40),
    role, restaurant, username, password, wage,
    position: v.position(restaurant, body.position),
    isMinor: !!body.isMinor,
  };
}

export const DEFAULT_AVAILABILITY = DAYS.map((day) => ({ day, unavailable: true, open: false, start: 9, end: 17 }));
