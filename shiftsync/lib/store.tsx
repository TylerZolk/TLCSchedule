'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Users, User, Availability, Schedule, Role, RestaurantKey, Shift, DayAvail, PositionKey, ShiftRequirements, ShiftSlot, SwapRequest, ComplianceWarning } from '@/types';
import { INITIAL_USERS, DAYS, POSITIONS, buildInitialAvailability, buildInitialSchedule, buildInitialShiftRequirements, fmtRange } from '@/lib/constants';

const api = (path: string, method = 'GET', body?: object) =>
  fetch(path, { method, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });

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
  addUser: (pin: number, name: string, role: Role, restaurant: RestaurantKey, username?: string, password?: string, position?: PositionKey, wage?: number, isMinor?: boolean) => string | null;
  editUser: (origPin: number, newPin: number, name: string, role: Role, restaurant: RestaurantKey, username?: string, password?: string, position?: PositionKey, wage?: number, isMinor?: boolean) => string | null;
  deleteUser: (pin: number) => void;
  flash: (msg: string) => void;
  getEmployees: (restaurant: string) => [string, User][];
  getManagers:  (restaurant: string) => [string, User][];
  getSchedulableStaff: (restaurant: string) => [string, User][];
  empWeekHours: (pin: number) => number;
  clearSchedule: (restaurant: RestaurantKey) => void;
  publishedAt: Partial<Record<RestaurantKey, Date>>;
  publishSchedule: (restaurant: RestaurantKey) => void;
  getComplianceWarnings: (restaurant: RestaurantKey) => ComplianceWarning[];
  swapRequests: Record<string, SwapRequest>;
  requestSwap: (fromPin: number, fromDay: string, toPin: number, toDay: string) => void;
  respondSwap: (id: string, accept: boolean) => void;
  approveSwap: (id: string, approve: boolean) => void;
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
  const [swapRequests,       setSwapRequests]       = useState<Record<string, SwapRequest>>({});
  const [publishedSchedules, setPublishedSchedules] = useState<Partial<Record<RestaurantKey, Schedule>>>({});
  const [publishedAt,        setPublishedAt]        = useState<Partial<Record<RestaurantKey, Date>>>({});

  // Load all data from the database on mount
  useEffect(() => {
    api('/api/data').then((r) => r.json()).then((data) => {
      if (!data.users || Object.keys(data.users).length === 0) return;
      setUsers(data.users);
      setAvailability(data.availability);
      setSchedule(data.schedule);
      // Merge API data with initial structure so restaurant/day keys always exist
      const baseReqs = buildInitialShiftRequirements();
      const apiReqs = data.shiftRequirements ?? {};
      for (const rest of Object.keys(baseReqs) as RestaurantKey[]) {
        if (apiReqs[rest]) baseReqs[rest] = { ...baseReqs[rest], ...apiReqs[rest] };
      }
      setShiftRequirements(baseReqs);
      setSwapRequests(data.swapRequests ?? {});
      const pa: Partial<Record<RestaurantKey, Date>> = {};
      for (const [k, v] of Object.entries(data.publishedAt ?? {})) pa[k as RestaurantKey] = new Date(v as string);
      if (Object.keys(pa).length) setPublishedAt(pa);
    }).catch(() => {}); // fall back to in-memory if DB unavailable
  }, []);
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
    api('/api/availability', 'PUT', { pin, day, field, value });
  }, []);

  const setShift = useCallback((pin: number, day: string, field: 's' | 'e', value: number) => {
    setSchedule((prev) => {
      const cur = prev[pin]?.[day] ?? { s: 9, e: 17, position: users[pin]?.position };
      const updated = { ...cur, [field]: value };
      api('/api/shifts', 'PUT', { pin, day, shift: updated });
      return { ...prev, [pin]: { ...prev[pin], [day]: updated } };
    });
  }, [users]);

  const setShiftPosition = useCallback((pin: number, day: string, position: PositionKey) => {
    setSchedule((prev) => {
      const cur = prev[pin]?.[day] ?? { s: 9, e: 17 };
      const updated = { ...cur, position };
      api('/api/shifts', 'PUT', { pin, day, shift: updated });
      return { ...prev, [pin]: { ...prev[pin], [day]: updated } };
    });
  }, []);

  const toggleOff = useCallback((pin: number, day: string) => {
    setSchedule((prev) => {
      const cur = prev[pin]?.[day];
      const next = cur ? null : { s: 9, e: 17, position: users[pin]?.position };
      api('/api/shifts', 'PUT', { pin, day, shift: next });
      return { ...prev, [pin]: { ...prev[pin], [day]: next } };
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

  const addUser = useCallback((pin: number, name: string, role: Role, restaurant: RestaurantKey, username?: string, password?: string, position?: PositionKey, wage?: number, isMinor?: boolean): string | null => {
    if (!name.trim())                           return 'Name is required.';
    if (isNaN(pin) || String(pin).length !== 4) return 'PIN must be exactly 4 digits.';
    if (users[pin])                             return 'PIN already in use.';
    const credentialError = validateCredentials(pin, role, username, password);
    if (credentialError) return credentialError;
    const newUser = {
      name: name.trim(), role, restaurant,
      ...(position ? { position } : {}), ...(wage ? { wage } : {}), ...(isMinor ? { isMinor: true } : {}),
      ...(role !== 'employee' ? { username: username!.trim(), password: password!.trim() } : {}),
    };
    setUsers((prev) => ({ ...prev, [pin]: newUser }));
    api('/api/users', 'POST', { pin, ...newUser });
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

  const editUser = useCallback((origPin: number, newPin: number, name: string, role: Role, restaurant: RestaurantKey, username?: string, password?: string, position?: PositionKey, wage?: number, isMinor?: boolean): string | null => {
    if (!name.trim())                                 return 'Name is required.';
    if (isNaN(newPin) || String(newPin).length !== 4) return 'PIN must be exactly 4 digits.';
    if (newPin !== origPin && users[newPin])           return 'PIN already in use.';
    const credentialError = validateCredentials(newPin, role, username, password, origPin);
    if (credentialError) return credentialError;
    const updatedUser = {
      pin: newPin, name: name.trim(), role, restaurant,
      ...(position ? { position } : {}), ...(wage ? { wage } : {}), ...(isMinor ? { isMinor: true } : {}),
      ...(role !== 'employee' ? { username: username!.trim(), password: password!.trim() } : {}),
    };
    setUsers((prev) => {
      const n = { ...prev };
      if (newPin !== origPin) delete n[origPin];
      n[newPin] = updatedUser;
      return n;
    });
    api(`/api/users/${origPin}`, 'PUT', updatedUser);
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
    api(`/api/users/${pin}`, 'DELETE');
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

  const shiftDur = (sh: Shift) => sh.e > sh.s ? sh.e - sh.s : 24 - sh.s + sh.e;

  const clearSchedule = useCallback((restaurant: RestaurantKey) => {
    const staffPins = Object.entries(users)
      .filter(([, u]) => u.restaurant === restaurant && (u.role === 'employee' || u.role === 'manager'))
      .map(([p]) => Number(p));
    const clearedShifts: Record<number, Record<string, null>> = {};
    staffPins.forEach((pin) => { clearedShifts[pin] = {}; DAYS.forEach((d) => { clearedShifts[pin][d] = null; }); });
    setSchedule((prev) => ({ ...prev, ...clearedShifts }));
    api('/api/shifts/bulk', 'POST', { pins: staffPins, shifts: clearedShifts });
  }, [users]);

  const publishSchedule = useCallback((restaurant: RestaurantKey) => {
    const pins = Object.entries(users)
      .filter(([, u]) => u.restaurant === restaurant && (u.role === 'employee' || u.role === 'manager'))
      .map(([p]) => Number(p));
    setPublishedSchedules((prev) => ({
      ...prev,
      [restaurant]: Object.fromEntries(pins.map((pin) => [pin, { ...schedule[pin] }])),
    }));
    setPublishedAt((prev) => ({ ...prev, [restaurant]: new Date() }));
    api('/api/publish', 'POST', { restaurant });
  }, [schedule, users]);

  const getComplianceWarnings = useCallback((restaurant: RestaurantKey): ComplianceWarning[] => {
    const warnings: ComplianceWarning[] = [];
    const staff = Object.entries(users).filter(([, u]) =>
      u.restaurant === restaurant && (u.role === 'employee' || u.role === 'manager')
    );
    const published = publishedSchedules[restaurant];

    for (const [pinStr, user] of staff) {
      const pin = Number(pinStr);
      let weeklyHours = 0;

      for (let di = 0; di < DAYS.length; di++) {
        const day  = DAYS[di];
        const sh   = schedule[pin]?.[day];
        if (!sh) continue;

        const dur = shiftDur(sh);
        weeklyHours += dur;

        if (dur > 10) {
          warnings.push({ type: 'long-shift', severity: 'warning', pin,
            message: `${user.name} has a ${dur}h shift on ${day}` });
        }

        if (user.isMinor) {
          const lateEnd = sh.e < sh.s || sh.e > 22;
          if (lateEnd || sh.s >= 22) {
            warnings.push({ type: 'minor-violation', severity: 'error', pin,
              message: `${user.name} is a minor scheduled past 10 pm on ${day}` });
          }
        }

        if (di < DAYS.length - 1) {
          const nextSh = schedule[pin]?.[DAYS[di + 1]];
          if (nextSh) {
            const rest = sh.e < sh.s ? nextSh.s - sh.e : (24 - sh.e) + nextSh.s;
            if (rest >= 0 && rest < 8) {
              warnings.push({ type: 'short-rest', severity: 'warning', pin,
                message: `${user.name} has only ${rest}h rest between ${day} and ${DAYS[di + 1]}` });
            }
          }
        }

        if (published) {
          const pubSh = published[pin]?.[day] ?? null;
          const curSh = schedule[pin]?.[day] ?? null;
          if (JSON.stringify(pubSh) !== JSON.stringify(curSh)) {
            warnings.push({ type: 'changed-after-publish', severity: 'info', pin,
              message: `${user.name}'s ${day} shift changed after publishing` });
          }
        }
      }

      if (weeklyHours > 40) {
        warnings.push({ type: 'overtime', severity: 'warning', pin,
          message: `${user.name} is scheduled ${weeklyHours}h this week (${weeklyHours - 40}h overtime)` });
      }
    }

    return warnings;
  }, [schedule, users, publishedSchedules]);

  const requestSwap = useCallback((fromPin: number, fromDay: string, toPin: number, toDay: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setSwapRequests((prev) => ({ ...prev, [id]: { id, fromPin, fromDay, toPin, toDay, status: 'pending' } }));
    api('/api/swap-requests', 'POST', { id, fromPin, fromDay, toPin, toDay });
  }, []);

  const respondSwap = useCallback((id: string, accept: boolean) => {
    const status = accept ? 'awaiting_approval' : 'declined';
    setSwapRequests((prev) => {
      const req = prev[id];
      if (!req) return prev;
      return { ...prev, [id]: { ...req, status } };
    });
    api(`/api/swap-requests/${id}`, 'PUT', { status });
  }, []);

  const approveSwap = useCallback((id: string, approve: boolean) => {
    const status = approve ? 'accepted' : 'declined';
    setSwapRequests((prev) => {
      const req = prev[id];
      if (!req) return prev;
      if (approve) {
        setSchedule((s) => {
          const fromShift = s[req.fromPin]?.[req.fromDay] ?? null;
          const toShift   = s[req.toPin]?.[req.toDay]   ?? null;
          return { ...s, [req.fromPin]: { ...s[req.fromPin], [req.fromDay]: toShift }, [req.toPin]: { ...s[req.toPin], [req.toDay]: fromShift } };
        });
      }
      return { ...prev, [id]: { ...req, status } };
    });
    api(`/api/swap-requests/${id}`, 'PUT', { status, swapShifts: approve });
  }, []);

  const addShiftSlot = useCallback((restaurant: RestaurantKey, day: string, position: PositionKey) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newSlot: ShiftSlot = { id, start: 18, end: 2, count: 1 };
    setShiftRequirements((prev) => {
      const dayReqs = prev[restaurant][day] ?? {};
      const existing = dayReqs[position] ?? [];
      return { ...prev, [restaurant]: { ...prev[restaurant], [day]: { ...dayReqs, [position]: [...existing, newSlot] } } };
    });
    api('/api/shift-slots', 'POST', { id, restaurant, day, position, start: newSlot.start, end: newSlot.end, count: newSlot.count });
  }, []);

  const updateShiftSlot = useCallback((restaurant: RestaurantKey, day: string, position: PositionKey, id: string, field: 'start' | 'end' | 'count', value: number) => {
    setShiftRequirements((prev) => {
      const slots = (prev[restaurant][day]?.[position] ?? []).map((s) => s.id === id ? { ...s, [field]: value } : s);
      return { ...prev, [restaurant]: { ...prev[restaurant], [day]: { ...prev[restaurant][day], [position]: slots } } };
    });
    api(`/api/shift-slots/${id}`, 'PUT', { field, value });
  }, []);

  const removeShiftSlot = useCallback((restaurant: RestaurantKey, day: string, position: PositionKey, id: string) => {
    setShiftRequirements((prev) => {
      const slots = (prev[restaurant][day]?.[position] ?? []).filter((s) => s.id !== id);
      return { ...prev, [restaurant]: { ...prev[restaurant], [day]: { ...prev[restaurant][day], [position]: slots } } };
    });
    api(`/api/shift-slots/${id}`, 'DELETE');
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
            const slotEndEff  = slot.end  < slot.start  ? slot.end  + 24 : slot.end;
            const availEndEff = avail.end < avail.start ? avail.end + 24 : avail.end;
            if (avail.start > slot.start || availEndEff < slotEndEff) return false;
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

    const pins = staff.map(([p]) => Number(p));
    api('/api/shifts/bulk', 'POST', { pins, shifts: newShifts });

    return warnings;
  }, [shiftRequirements, availability, users]);

  return (
    <StoreContext.Provider value={{
      users, availability, schedule, authUser, savedMsg, weekOffset,
      login, loginWithCredentials, logout, setWeekOffset, setAvailDay, setShift, setShiftPosition, toggleOff,
      addUser, editUser, deleteUser, flash,
      getEmployees, getManagers, getSchedulableStaff, empWeekHours,
      publishedAt, clearSchedule, publishSchedule, getComplianceWarnings,
      swapRequests, requestSwap, respondSwap, approveSwap,
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
