import { User } from '@prisma/client';

/** What the browser is told about the signed-in user. */
export function sessionUserJson(u: User) {
  return {
    pin: u.pin, name: u.name, role: u.role, restaurant: u.restaurant,
    ...(u.position ? { position: u.position } : {}),
    ...(u.isMinor ? { isMinor: true } : {}),
  };
}
