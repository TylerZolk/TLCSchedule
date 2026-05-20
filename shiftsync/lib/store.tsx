'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Users, User, Availability, Schedule, Role, RestaurantKey, Shift, DayAvail, PositionKey, ShiftRequirements, ShiftSlot } from '@/types';
import { INITIAL_USERS, DAYS, POSITIONS, buildInitialAvailability, buildInitialSchedule, buildInitialShiftRequirements, fmtRange } from '@/lib/constants';

interface AuthUser extends User { pin: number; }

interface StoreCtx {
  users: Users;
  availability: Availability;
  schedule: Schedule;
  authUser: AuthUser | null;
  savedMsg: string;
  weekOffset: number;
  login: (pin: number) => boolean;
  loginWithCredentials: (username: string, password: string) => boolean;
  logout: () => void;
  setWeekOffset: React.Dispatch<React.SetStateAction<number>>;
  setAvailDay: (pin: number, day: string, field: keyof DayAvail, value: boolean | number) => void;
  setShift: (pin: number, day: string, field: 's' | 'e', value: number) => void;
  setShiftPosition: (pin: number, day: string, position: PositionKey) => void;
  toggleOff: (pin: number, day: string) => void;
  addUser: (pin: number, name: string, role: Role, restaurant: RestaurantKey, username?: string, password?: string, position?: PositionKey) => string | null;
  editUser: (origPin: number, newPin: number, name: string, role: Role, restaurant: RestaurantKey, username?: string, password?: string, position?: PositionKey) => string | null;
  deleteUser: (pin: number) => void;
  flash: (msg: string) => void;
  getEmployees: (restaurant: string) => [string, User][];
  getManagers:  (restaurant: string) => [string, User][];
  getSchedulableStaff: (restaurant: string) => [string, User][];
  empWeekHours: (pin: number) => number;
  shiftRequirements: ShiftRequirements;
  addShiftSlot: (restaurant: RestaurantKey, day: string, position: PositionKey) => void;
  updateShiftSlot: (restaurant: RestaurantKey, day: string, position: PositionKey, id: string, field: 'start' | 'end' | 'count', value: number) => void;
  removeShiftSlot: (restaurant: RestaurantKey, day: string, position: PositionKey, id: string) => void;
  autoSchedule: (restaurant: RestaurantKey) => string[];
}

const StoreContext = createContext<StoreCtx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [users,             setUsers]             = useState<Users>(INITIAL_USERS);
  const [availability,      setAvailability]      = useState<Availability>(() => buildInitialAvailability(INITIAL_USERS));
  const [schedule,          setSchedule]          = useState<Schedule>(() => buildInitialSchedule(INITIAL_USERS));
  const [shiftRequirements, setShiftRequirements] = useState<ShiftRequirements>(buildInitialShiftRequirements);
  const [authUser,          setAuthUser]          = useState<AuthUser | null>(null);
  const [savedMsg,          setSavedMsg]          = useState('');
  const [weekOffset,        setWeekOffset]        = useState(0);

  const flash = useCallback((msg: string) => {
    setSavedMsg(msg);
    setTimeout(() => setSavedMsg(''), 3000);
  }, []);

  const login = useCallback((pin: number): boolean => {
    const u = users[pin];
    if (!u || u.role !== 'employee') return false;
    setAuthUser({ ...u, pin });
    return true;
  }, [users]);

  const loginWithCredentials = useCallback((username: string, password: string): boolean => {
    const normalized = username.trim().toLowerCase();
    const found = Object.entries(users).find(([, u]) =>
      u.role !== 'employee' &&
      u.username?.toLowerCase() === normalized &&
      u.password === password
    );
    if (!found) return false;
    const [pin, user] = found;
    setAuthUser({ ...user, pin: Number(pin) });
    return true;
  }, [users]);

  const logout = useCallback(() => { setAuthUser(null); setWeekOffset(0); }, []);

  const setAvailDay = useCallback((pin: number, day: string, field: keyof DayAvail, value: boolean | number) => {
    setAvailability((prev) => ({
      ...prev,
      [pin]: { ...prev[pin], [day]: { ...prev[pin]?.[day], [field]: value } },
    }));
  }, []);

  const setShift = useCallback((pin: number, day: string, field: 's' | 'e', value: number) => {
    setSchedule((prev) => {
      const cur = prev[pin]?.[day] ?? { s: 9, e: 17, position: users[pin]?.position };
      return { ...prev, [pin]: { ...prev[pin], [day]: { ...cur, [field]: value } } };
    });
  }, [users]);

  const setShiftPosition = useCallback((pin: number, day: string, position: PositionKey) => {
    setSchedule((prev) => {
      const cur = prev[pin]?.[day] ?? { s: 9, e: 17 };
      return { ...prev, [pin]: { ...prev[pin], [day]: { ...cur, position } } };
    });
  }, []);

  const toggleOff = useCallback((pin: number, day: string) => {
    setSchedule((prev) => {
      const cur = prev[pin]?.[day];
      return { ...prev, [pin]: { ...prev[pin], [day]: cur ? null : { s: 9, e: 17, position: users[pin]?.position } } };
    });
  }, [users]);

  const validateCredentials = useCallback((pin: number, role: Role, username?: string, password?: string, originalPin?: number): string | null => {
    if (role === 'employee') return null;
    const trimmedUsername = username?.trim() ?? '';
    if (!trimmedUsername) return 'Username is required for managers.';
    if (!password?.trim()) return 'Password is required for managers.';
    const usernameTaken = Object.entries(users).some(([p, u]) =>
      Number(p) !== (originalPin ?? pin) &&
      u.role !== 'employee' &&
      u.username?.toLowerCase() === trimmedUsername.toLowerCase()
    );
    return usernameTaken ? 'Username already in use.' : null;
  }, [users]);

  const addUser = useCallback((pin: number, name: string, role: Role, restaurant: RestaurantKey, username?: string, password?: string, position?: PositionKey): string | null => {
    if (!name.trim())                           return 'Name is required.';
    if (isNaN(pin) || String(pin).length !== 4) return 'PIN must be exactly 4 digits.';
    if (users[pin])                             return 'PIN already in use.';
    const credentialError = validateCredentials(pin, role, username, password);
    if (credentialError) return credentialError;
    setUsers((prev) => ({
      ...prev,
      [pin]: {
        name: name.trim(),
        role,
        restaurant,
        ...(position ? { position } : {}),
        ...(role !== 'employee' ? { username: username!.trim(), password: password!.trim() } : {}),
      },
    }));
    setAvailability((prev) => {
      const map: { [d: string]: DayAvail } = {};
      DAYS.forEach((d) => { map[d] = { unavailable: false, start: 9, end: 17 }; });
      return { ...prev, [pin]: map };
    });
    setSchedule((prev) => {
      const map: { [d: string]: Shift | null } = {};
      DAYS.forEach((d) => { map[d] = null; });
      return { ...prev, [pin]: map };
    });
    return null;
  }, [users, validateCredentials]);

  const editUser = useCallback((origPin: number, newPin: number, name: string, role: Role, restaurant: RestaurantKey, username?: string, password?: string, position?: PositionKey): string | null => {
    if (!name.trim())                                 return 'Name is required.';
    if (isNaN(newPin) || String(newPin).length !== 4) return 'PIN must be exactly 4 digits.';
    if (newPin !== origPin && users[newPin])           return 'PIN already in use.';
    const credentialError = validateCredentials(newPin, role, username, password, origPin);
    if (credentialError) return credentialError;
    setUsers((prev) => {
      const n = { ...prev };
      if (newPin !== origPin) delete n[origPin];
      n[newPin] = {
        name: name.trim(),
        role,
        restaurant,
        ...(position ? { position } : {}),
        ...(role !== 'employee' ? { username: username!.trim(), password: password!.trim() } : {}),
      };
      return n;
    });
    if (newPin !== origPin) {
      setAvailability((prev) => { const n = { ...prev, [newPin]: prev[origPin] ?? {} }; delete n[origPin]; return n; });
      setSchedule((prev)     => { const n = { ...prev, [newPin]: prev[origPin] ?? {} }; delete n[origPin]; return n; });
    } else {
      setSchedule((prev) => {
        if (prev[newPin]) return prev;
        const map: { [d: string]: Shift | null } = {};
        DAYS.forEach((d) => { map[d] = null; });
        return { ...prev, [newPin]: map };
      });
    }
    return null;
  }, [users, validateCredentials]);

  const deleteUser = useCallback((pin: number) => {
    setUsers((prev)        => { const n = { ...prev }; delete n[pin]; return n; });
    setAvailability((prev) => { const n = { ...prev }; delete n[pin]; return n; });
    setSchedule((prev)     => { const n = { ...prev }; delete n[pin]; return n; });
  }, []);

  const getEmployees = useCallback((restaurant: string): [string, User][] =>
    Object.entries(users).filter(([, u]) => u.restaurant === restaurant && u.role === 'employee'),
  [users]);

  const getManagers = useCallback((restaurant: string): [string, User][] =>
    Object.entries(users).filter(([, u]) => u.restaurant === restaurant && u.role === 'manager'),
  [users]);

  const getSchedulableStaff = useCallback((restaurant: string): [string, User][] => {
    const posOrder = POSITIONS[restaurant as RestaurantKey]?.map((p) => p.key) ?? [];
    return Object.entries(users)
      .filter(([, u]) => u.restaurant === restaurant && (u.role === 'employee' || u.role === 'manager'))
      .sort(([, a], [, b]) => {
        const ai = a.position ? posOrder.indexOf(a.position) : posOrder.length;
        const bi = b.position ? posOrder.indexOf(b.position) : posOrder.length;
        if (ai !== bi) return ai - bi;
        return a.name.localeCompare(b.name);
      });
  }, [users]);

  const empWeekHours = useCallback((pin: number): number =>
    DAYS.reduce((acc, d) => { const sh = schedule[pin]?.[d]; return acc + (sh ? sh.e - sh.s : 0); }, 0),
  [schedule]);

  const addShiftSlot = useCallback((restaurant: RestaurantKey, day: string, position: PositionKey) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newSlot: ShiftSlot = { id, start: 18, end: 2, count: 1 };
    setShiftRequirements((prev) => {
      const dayReqs = prev[restaurant][day] ?? {};
      const existing = dayReqs[position] ?? [];
      return { ...prev, [restaurant]: { ...prev[restaurant], [day]: { ...dayReqs, [position]: [...existing, newSlot] } } };
    });
  }, []);

  const updateShiftSlot = useCallback((restaurant: RestaurantKey, day: string, position: PositionKey, id: string, field: 'start' | 'end' | 'count', value: number) => {
    setShiftRequirements((prev) => {
      const slots = (prev[restaurant][day]?.[position] ?? []).map((s) => s.id === id ? { ...s, [field]: value } : s);
      return { ...prev, [restaurant]: { ...prev[restaurant], [day]: { ...prev[restaurant][day], [position]: slots } } };
    });
  }, []);

  const removeShiftSlot = useCallback((restaurant: RestaurantKey, day: string, position: PositionKey, id: string) => {
    setShiftRequirements((prev) => {
      const slots = (prev[restaurant][day]?.[position] ?? []).filter((s) => s.id !== id);
      return { ...prev, [restaurant]: { ...prev[restaurant], [day]: { ...prev[restaurant][day], [position]: slots } } };
    });
  }, []);

  const autoSchedule = useCallback((restaurant: RestaurantKey): string[] => {
    const warnings: string[] = [];
    const reqs = shiftRequirements[restaurant];
    const staff = Object.entries(users).filter(([, u]) =>
      u.restaurant === restaurant && (u.role === 'employee' || u.role === 'manager')
    );

    const newShifts: Record<number, Record<string, Shift | null>> = {};
    for (const [pinStr] of staff) {
      const pin = Number(pinStr);
      newShifts[pin] = {};
      DAYS.forEach((d) => { newShifts[pin][d] = null; });
    }

    const assignedPerDay: Record<string, Set<number>> = {};
    DAYS.forEach((d) => { assignedPerDay[d] = new Set(); });

    for (const day of DAYS) {
      const dayReqs = reqs[day] ?? {};
      for (const [posStr, slots] of Object.entries(dayReqs) as [PositionKey, ShiftSlot[]][]) {
        for (const slot of slots ?? []) {
          const eligible = staff.filter(([pinStr, user]) => {
            const pin = Number(pinStr);
            if (user.position !== posStr) return false;
            if (assignedPerDay[day].has(pin)) return false;
            const avail = availability[pin]?.[day];
            if (!avail || avail.unavailable) return false;
            if (avail.start > slot.start || avail.end < slot.end) return false;
            return true;
          });
          const shuffled = [...eligible].sort(() => Math.random() - 0.5);
          const toAssign = shuffled.slice(0, slot.count);
          for (const [pinStr] of toAssign) {
            const pin = Number(pinStr);
            newShifts[pin][day] = { s: slot.start, e: slot.end, position: posStr };
            assignedPerDay[day].add(pin);
          }
          if (toAssign.length < slot.count) {
            warnings.push(`${day} · ${posStr} · ${fmtRange(slot.start, slot.end)}: need ${slot.count}, found ${toAssign.length}`);
          }
        }
      }
    }

    setSchedule((prev) => {
      const next = { ...prev };
      for (const [pinStr] of staff) {
        const pin = Number(pinStr);
        next[pin] = newShifts[pin];
      }
      return next;
    });

    return warnings;
  }, [shiftRequirements, availability, users]);

  return (
    <StoreContext.Provider value={{
      users, availability, schedule, authUser, savedMsg, weekOffset,
      login, loginWithCredentials, logout, setWeekOffset, setAvailDay, setShift, setShiftPosition, toggleOff,
      addUser, editUser, deleteUser, flash,
      getEmployees, getManagers, getSchedulableStaff, empWeekHours,
      shiftRequirements, addShiftSlot, updateShiftSlot, removeShiftSlot, autoSchedule,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
