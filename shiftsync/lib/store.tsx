'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { Users, User, Availability, Schedule, Role, RestaurantKey, Shift, DayAvail, PositionKey, ShiftRequirements, ShiftSlot, SwapRequest, ComplianceWarning, ShiftPreset, PublishedWeek } from '@/types';
import { DAYS, POSITIONS, buildInitialShiftRequirements, fmtRange } from '@/lib/constants';

/** Sunday of the week `offset` weeks from now, as a local YYYY-MM-DD string */
export function weekStartStr(offset: number): string {
  const sun = new Date();
  sun.setDate(sun.getDate() - sun.getDay() + offset * 7);
  const mm = String(sun.getMonth() + 1).padStart(2, '0');
  const dd = String(sun.getDate()).padStart(2, '0');
  return `${sun.getFullYear()}-${mm}-${dd}`;
}

class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

async function api<T = Record<string, unknown>>(path: string, method = 'GET', body?: object): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error ?? 'Could not reach the server. Check your connection.');
  return data as T;
}

const shiftDur = (sh: Shift) => sh.e > sh.s ? sh.e - sh.s : 24 - sh.s + sh.e;
const sameShifts = (a: Shift[], b: Shift[]) =>
  JSON.stringify(a.map(({ s, e, position }) => [s, e, position ?? null])) ===
  JSON.stringify(b.map(({ s, e, position }) => [s, e, position ?? null]));

interface AuthUser extends User { pin: number; }
export type FlashKind = 'success' | 'error';

interface DataResponse {
  users: Users;
  availability: Availability;
  schedule: Schedule;
  published: Partial<Record<RestaurantKey, PublishedWeek>>;
  shiftRequirements: Partial<ShiftRequirements>;
  swapRequests: Record<string, SwapRequest>;
  shiftPresets: Partial<Record<RestaurantKey, ShiftPreset[]>>;
}

interface StoreCtx {
  ready: boolean;
  users: Users;
  availability: Availability;
  schedule: Schedule;
  weekStart: string;
  getWeekSchedule: (ws: string) => Schedule | undefined;
  authUser: AuthUser | null;
  savedMsg: string;
  savedKind: FlashKind;
  weekOffset: number;
  login: (pin: number) => Promise<string | null>;
  loginWithCredentials: (username: string, password: string) => Promise<string | null>;
  logout: () => void;
  setWeekOffset: React.Dispatch<React.SetStateAction<number>>;
  setAvailDay: (pin: number, day: string, patch: Partial<DayAvail>) => void;
  addShift: (pin: number, day: string) => void;
  removeShift: (pin: number, day: string, shiftId: number) => void;
  updateShift: (pin: number, day: string, shiftId: number, field: 's' | 'e', value: number) => void;
  updateShiftPosition: (pin: number, day: string, shiftId: number, position: PositionKey) => void;
  addUser: (pin: number, name: string, role: Role, restaurant: RestaurantKey, username?: string, password?: string, position?: PositionKey, wage?: number, isMinor?: boolean) => Promise<string | null>;
  editUser: (origPin: number, newPin: number, name: string, role: Role, restaurant: RestaurantKey, username?: string, password?: string, position?: PositionKey, wage?: number, isMinor?: boolean) => Promise<string | null>;
  deleteUser: (pin: number) => Promise<string | null>;
  flash: (msg: string, kind?: FlashKind) => void;
  getEmployees: (restaurant: string) => [string, User][];
  getManagers:  (restaurant: string) => [string, User][];
  getSchedulableStaff: (restaurant: string) => [string, User][];
  empWeekHours: (pin: number) => number;
  clearSchedule: (restaurant: RestaurantKey) => void;
  publishedAt: Partial<Record<RestaurantKey, Date>>;
  publishSchedule: (restaurant: RestaurantKey) => Promise<boolean>;
  getComplianceWarnings: (restaurant: RestaurantKey) => ComplianceWarning[];
  shiftPresets: Record<RestaurantKey, ShiftPreset[]>;
  addShiftPreset: (restaurant: RestaurantKey, name: string, start: number, end: number, position?: PositionKey) => void;
  removeShiftPreset: (restaurant: RestaurantKey, id: number) => void;
  swapRequests: Record<string, SwapRequest>;
  requestSwap: (fromPin: number, fromDay: string, toPin: number, toDay: string) => void;
  respondSwap: (id: string, accept: boolean) => void;
  approveSwap: (id: string, approve: boolean) => Promise<boolean>;
  shiftRequirements: ShiftRequirements;
  addShiftSlot: (restaurant: RestaurantKey, day: string, position: PositionKey) => void;
  updateShiftSlot: (restaurant: RestaurantKey, day: string, position: PositionKey, id: string, field: 'start' | 'end' | 'count', value: number) => void;
  removeShiftSlot: (restaurant: RestaurantKey, day: string, position: PositionKey, id: string) => void;
  autoSchedule: (restaurant: RestaurantKey) => string[];
}

const StoreContext = createContext<StoreCtx | null>(null);

const isStaffRole = (role?: Role) => role === 'employee';
const EMPTY_PRESETS: Record<RestaurantKey, ShiftPreset[]> = { tlc: [], nickys: [], farmhouse: [] };

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready,             setReady]             = useState(false);
  const [users,             setUsers]             = useState<Users>({});
  const [availability,      setAvailability]      = useState<Availability>({});
  const [scheduleCache,     setScheduleCache]     = useState<Record<string, Schedule>>({});
  const [publishedCache,    setPublishedCache]    = useState<Record<string, Partial<Record<RestaurantKey, PublishedWeek>>>>({});
  const [shiftRequirements, setShiftRequirements] = useState<ShiftRequirements>(buildInitialShiftRequirements);
  const [swapRequests,      setSwapRequests]      = useState<Record<string, SwapRequest>>({});
  const [shiftPresets,      setShiftPresets]      = useState<Record<RestaurantKey, ShiftPreset[]>>(EMPTY_PRESETS);
  const loadedWeeks = useRef<Set<string>>(new Set());

  const [authUser,   setAuthUser]   = useState<AuthUser | null>(null);
  const [savedMsg,   setSavedMsg]   = useState('');
  const [savedKind,  setSavedKind]  = useState<FlashKind>('success');
  const [weekOffset, setWeekOffset] = useState(0);
  const flashTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const weekStart = weekStartStr(weekOffset);
  const schedule: Schedule = scheduleCache[weekStart] ?? {};

  const flash = useCallback((msg: string, kind: FlashKind = 'success') => {
    setSavedMsg(msg);
    setSavedKind(kind);
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setSavedMsg(''), kind === 'error' ? 6000 : 3000);
  }, []);

  const resetData = useCallback(() => {
    loadedWeeks.current.clear();
    setUsers({}); setAvailability({}); setScheduleCache({}); setPublishedCache({});
    setShiftRequirements(buildInitialShiftRequirements()); setSwapRequests({}); setShiftPresets(EMPTY_PRESETS);
  }, []);

  const handleAuthLost = useCallback((e: unknown) => {
    if (e instanceof ApiError && e.status === 401) {
      setAuthUser(null);
      setWeekOffset(0);
      resetData();
    }
  }, [resetData]);

  /** Loads everything for one week. `full` also replaces users, availability, templates and swaps. */
  const loadWeek = useCallback(async (ws: string, full: boolean) => {
    loadedWeeks.current.add(ws);
    const data = await api<DataResponse>(`/api/data?weekStart=${ws}`);
    setScheduleCache((prev) => ({ ...prev, [ws]: data.schedule }));
    setPublishedCache((prev) => ({ ...prev, [ws]: data.published }));
    if (!full) return;
    setUsers(data.users);
    setAvailability(data.availability);
    const reqs = buildInitialShiftRequirements();
    for (const rest of Object.keys(reqs) as RestaurantKey[]) {
      if (data.shiftRequirements[rest]) reqs[rest] = { ...reqs[rest], ...data.shiftRequirements[rest] };
    }
    setShiftRequirements(reqs);
    setSwapRequests(data.swapRequests);
    setShiftPresets({ ...EMPTY_PRESETS, ...data.shiftPresets });
  }, []);

  /** Throws away local state and reloads from the server — used after any failed save. */
  const resync = useCallback(async () => {
    const ws = weekStartStr(weekOffset);
    loadedWeeks.current.clear();
    setScheduleCache({});
    setPublishedCache({});
    await loadWeek(ws, true).catch(handleAuthLost);
  }, [weekOffset, loadWeek, handleAuthLost]);

  /** Runs a save; on failure shows the server's message and reloads so the screen matches the database. */
  const save = useCallback(<T,>(promise: Promise<T>): Promise<T | undefined> =>
    promise.catch((e) => {
      flash(e instanceof Error ? e.message : 'Save failed.', 'error');
      handleAuthLost(e);
      if (!(e instanceof ApiError && e.status === 401)) resync();
      return undefined;
    }),
  [flash, handleAuthLost, resync]);

  // Restore an existing session on page load
  useEffect(() => {
    api<{ user: AuthUser }>('/api/auth/me')
      .then(async ({ user }) => { setAuthUser(user); await loadWeek(weekStartStr(0), true); })
      .catch(() => {})
      .finally(() => setReady(true));
  }, [loadWeek]);

  // Load schedule for a week we haven't seen yet
  useEffect(() => {
    if (!authUser || loadedWeeks.current.has(weekStart)) return;
    loadWeek(weekStart, false).catch((e) => { loadedWeeks.current.delete(weekStart); handleAuthLost(e); });
  }, [authUser, weekStart, loadWeek, handleAuthLost]);

  const startSession = useCallback(async (path: string, body: object): Promise<string | null> => {
    try {
      const { user } = await api<{ user: AuthUser }>(path, 'POST', body);
      resetData();
      setWeekOffset(0);
      await loadWeek(weekStartStr(0), true);
      setAuthUser(user);
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : 'Sign-in failed.';
    }
  }, [loadWeek, resetData]);

  const login = useCallback((pin: number) => startSession('/api/auth/pin', { pin }), [startSession]);
  const loginWithCredentials = useCallback((username: string, password: string) =>
    startSession('/api/auth/login', { username, password }), [startSession]);

  const logout = useCallback(() => {
    api('/api/auth/logout', 'POST').catch(() => {});
    setAuthUser(null);
    setWeekOffset(0);
    resetData();
  }, [resetData]);

  const setAvailDay = useCallback((pin: number, day: string, patch: Partial<DayAvail>) => {
    setAvailability((prev) => ({
      ...prev,
      [pin]: { ...prev[pin], [day]: { ...prev[pin]?.[day], ...patch } },
    }));
    save(api('/api/availability', 'PUT', { pin, day, ...patch }));
  }, [save]);

  const updateWeekDay = useCallback((ws: string, pin: number, day: string, fn: (shifts: Shift[]) => Shift[]) => {
    setScheduleCache((prev) => {
      const week = prev[ws] ?? {};
      return { ...prev, [ws]: { ...week, [pin]: { ...week[pin], [day]: fn(week[pin]?.[day] ?? []) } } };
    });
  }, []);

  const addShift = useCallback((pin: number, day: string) => {
    const ws = weekStartStr(weekOffset);
    // Negative IDs mark shifts the server hasn't confirmed yet; they can't be edited until it does
    const tempId = -Date.now();
    const newShift: Shift = { id: tempId, s: 18, e: 2, position: users[pin]?.position };
    updateWeekDay(ws, pin, day, (list) => [...list, newShift]);
    save(api<{ id: number }>('/api/shifts', 'POST', { pin, day, start: newShift.s, end: newShift.e, position: newShift.position ?? null, weekStart: ws }))
      .then((data) => {
        if (data) updateWeekDay(ws, pin, day, (list) => list.map((sh) => sh.id === tempId ? { ...sh, id: data.id } : sh));
      });
  }, [users, weekOffset, save, updateWeekDay]);

  const removeShift = useCallback((pin: number, day: string, shiftId: number) => {
    updateWeekDay(weekStartStr(weekOffset), pin, day, (list) => list.filter((sh) => sh.id !== shiftId));
    save(api(`/api/shifts/${shiftId}`, 'DELETE'));
  }, [weekOffset, save, updateWeekDay]);

  const updateShift = useCallback((pin: number, day: string, shiftId: number, field: 's' | 'e', value: number) => {
    updateWeekDay(weekStartStr(weekOffset), pin, day, (list) => list.map((sh) => sh.id === shiftId ? { ...sh, [field]: value } : sh));
    save(api(`/api/shifts/${shiftId}`, 'PUT', { [field === 's' ? 'start' : 'end']: value }));
  }, [weekOffset, save, updateWeekDay]);

  const updateShiftPosition = useCallback((pin: number, day: string, shiftId: number, position: PositionKey) => {
    updateWeekDay(weekStartStr(weekOffset), pin, day, (list) => list.map((sh) => sh.id === shiftId ? { ...sh, position } : sh));
    save(api(`/api/shifts/${shiftId}`, 'PUT', { position }));
  }, [weekOffset, save, updateWeekDay]);

  const validateStaff = useCallback((pin: number, name: string, role: Role, username?: string, password?: string, originalPin?: number): string | null => {
    if (!name.trim())                           return 'Name is required.';
    if (isNaN(pin) || String(pin).length !== 4) return 'PIN must be exactly 4 digits.';
    if (pin !== originalPin && users[pin])      return 'PIN already in use.';
    if (isStaffRole(role)) return null;
    const trimmedUsername = username?.trim() ?? '';
    if (!trimmedUsername) return 'Username is required for managers.';
    const keepsPassword = originalPin != null && users[originalPin]?.hasPassword;
    if (!password?.trim() && !keepsPassword) return 'Password is required for managers.';
    const usernameTaken = Object.entries(users).some(([p, u]) =>
      Number(p) !== originalPin && u.username?.toLowerCase() === trimmedUsername.toLowerCase()
    );
    return usernameTaken ? 'Username already in use.' : null;
  }, [users]);

  /** Sends a staff change and reloads from the server; returns an error message or null. */
  const saveStaff = useCallback(async (request: Promise<unknown>): Promise<string | null> => {
    try {
      await request;
      await loadWeek(weekStartStr(weekOffset), true);
      return null;
    } catch (e) {
      handleAuthLost(e);
      return e instanceof Error ? e.message : 'Save failed.';
    }
  }, [loadWeek, weekOffset, handleAuthLost]);

  const addUser = useCallback(async (pin: number, name: string, role: Role, restaurant: RestaurantKey, username?: string, password?: string, position?: PositionKey, wage?: number, isMinor?: boolean) => {
    const err = validateStaff(pin, name, role, username, password);
    if (err) return err;
    return saveStaff(api('/api/users', 'POST', { pin, name, role, restaurant, username, password, position, wage, isMinor }));
  }, [validateStaff, saveStaff]);

  const editUser = useCallback(async (origPin: number, newPin: number, name: string, role: Role, restaurant: RestaurantKey, username?: string, password?: string, position?: PositionKey, wage?: number, isMinor?: boolean) => {
    const err = validateStaff(newPin, name, role, username, password, origPin);
    if (err) return err;
    const result = await saveStaff(api(`/api/users/${origPin}`, 'PUT', { pin: newPin, name, role, restaurant, username, password, position, wage, isMinor }));
    // Other weeks are cached under the old PIN
    if (!result && newPin !== origPin) {
      const ws = weekStartStr(weekOffset);
      loadedWeeks.current = new Set([ws]);
      setScheduleCache((prev) => ({ [ws]: prev[ws] }));
    }
    return result;
  }, [validateStaff, saveStaff, weekOffset]);

  const deleteUser = useCallback((pin: number) => saveStaff(api(`/api/users/${pin}`, 'DELETE')), [saveStaff]);

  const getEmployees = useCallback((restaurant: string): [string, User][] =>
    Object.entries(users).filter(([, u]) => u.restaurant === restaurant && isStaffRole(u.role)),
  [users]);

  const getManagers = useCallback((restaurant: string): [string, User][] =>
    Object.entries(users).filter(([, u]) => u.restaurant === restaurant && u.role === 'manager'),
  [users]);

  const getSchedulableStaff = useCallback((restaurant: string): [string, User][] => {
    const posOrder = POSITIONS[restaurant as RestaurantKey]?.map((p) => p.key) ?? [];
    return Object.entries(users)
      .filter(([, u]) => u.restaurant === restaurant && (isStaffRole(u.role) || u.role === 'manager'))
      .sort(([, a], [, b]) => {
        const ai = a.position ? posOrder.indexOf(a.position) : posOrder.length;
        const bi = b.position ? posOrder.indexOf(b.position) : posOrder.length;
        if (ai !== bi) return ai - bi;
        return a.name.localeCompare(b.name);
      });
  }, [users]);

  const staffPins = useCallback((restaurant: RestaurantKey) =>
    Object.entries(users)
      .filter(([, u]) => u.restaurant === restaurant && (isStaffRole(u.role) || u.role === 'manager'))
      .map(([p]) => Number(p)),
  [users]);

  const empWeekHours = useCallback((pin: number): number =>
    DAYS.reduce((acc, d) => acc + (schedule[pin]?.[d] ?? []).reduce((a, sh) => a + shiftDur(sh), 0), 0),
  [schedule]);

  /** Replaces a restaurant's week on the server and uses the saved shifts (with real IDs). */
  const saveWeek = useCallback((restaurant: RestaurantKey, ws: string, shifts: Record<number, Record<string, Shift[]>>) => {
    setScheduleCache((prev) => ({ ...prev, [ws]: { ...(prev[ws] ?? {}), ...shifts } }));
    save(api<{ schedule: Schedule }>('/api/shifts/bulk', 'POST', { restaurant, shifts, weekStart: ws }))
      .then((data) => {
        if (data) setScheduleCache((prev) => ({ ...prev, [ws]: { ...(prev[ws] ?? {}), ...data.schedule } }));
      });
  }, [save]);

  const clearSchedule = useCallback((restaurant: RestaurantKey) => {
    const cleared: Record<number, Record<string, Shift[]>> = {};
    staffPins(restaurant).forEach((pin) => { cleared[pin] = {}; DAYS.forEach((d) => { cleared[pin][d] = []; }); });
    saveWeek(restaurant, weekStartStr(weekOffset), cleared);
  }, [staffPins, saveWeek, weekOffset]);

  const published = publishedCache[weekStart] ?? {};
  const publishedAt: Partial<Record<RestaurantKey, Date>> = {};
  for (const [k, v] of Object.entries(published)) if (v) publishedAt[k as RestaurantKey] = new Date(v.publishedAt);

  const publishSchedule = useCallback(async (restaurant: RestaurantKey) => {
    const ws = weekStartStr(weekOffset);
    const data = await save(api<PublishedWeek>('/api/publish', 'POST', { restaurant, weekStart: ws }));
    if (!data) return false;
    setPublishedCache((prev) => ({ ...prev, [ws]: { ...(prev[ws] ?? {}), [restaurant]: data } }));
    return true;
  }, [save, weekOffset]);

  const getComplianceWarnings = useCallback((restaurant: RestaurantKey): ComplianceWarning[] => {
    const warnings: ComplianceWarning[] = [];
    const staff = Object.entries(users).filter(([, u]) =>
      u.restaurant === restaurant && (isStaffRole(u.role) || u.role === 'manager')
    );
    const snapshot = published[restaurant]?.snapshot;

    for (const [pinStr, user] of staff) {
      const pin = Number(pinStr);
      let weeklyHours = 0;

      for (let di = 0; di < DAYS.length; di++) {
        const day    = DAYS[di];
        const shifts = [...(schedule[pin]?.[day] ?? [])].sort((a, b) => a.s - b.s);

        if (snapshot && !sameShifts(snapshot[pin]?.[day] ?? [], shifts)) {
          warnings.push({ type: 'changed-after-publish', severity: 'info', pin,
            message: `${user.name}'s ${day} shift changed after publishing` });
        }
        if (shifts.length === 0) continue;

        for (const sh of shifts) {
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
        }

        // Short rest: compare last shift of this day to first shift of next day
        if (di < DAYS.length - 1) {
          const nextShifts = [...(schedule[pin]?.[DAYS[di + 1]] ?? [])].sort((a, b) => a.s - b.s);
          if (nextShifts.length > 0) {
            const lastSh = shifts[shifts.length - 1];
            const firstNext = nextShifts[0];
            const rest = lastSh.e < lastSh.s ? firstNext.s - lastSh.e : (24 - lastSh.e) + firstNext.s;
            if (rest >= 0 && rest < 8) {
              warnings.push({ type: 'short-rest', severity: 'warning', pin,
                message: `${user.name} has only ${rest}h rest between ${day} and ${DAYS[di + 1]}` });
            }
          }
        }
      }

      if (weeklyHours > 40) {
        warnings.push({ type: 'overtime', severity: 'warning', pin,
          message: `${user.name} is scheduled ${weeklyHours}h this week (${weeklyHours - 40}h overtime)` });
      }
    }

    return warnings;
  }, [schedule, users, published]);

  const addShiftPreset = useCallback((restaurant: RestaurantKey, name: string, start: number, end: number, position?: PositionKey) => {
    save(api<ShiftPreset>('/api/shift-presets', 'POST', { restaurant, name, start, end, position: position ?? null }))
      .then((data) => {
        if (!data) return;
        setShiftPresets((prev) => ({
          ...prev,
          [restaurant]: [...(prev[restaurant] ?? []), { id: data.id, name, start, end, ...(position ? { position } : {}) }],
        }));
      });
  }, [save]);

  const removeShiftPreset = useCallback((restaurant: RestaurantKey, id: number) => {
    setShiftPresets((prev) => ({ ...prev, [restaurant]: (prev[restaurant] ?? []).filter((p) => p.id !== id) }));
    save(api(`/api/shift-presets/${id}`, 'DELETE'));
  }, [save]);

  const requestSwap = useCallback((fromPin: number, fromDay: string, toPin: number, toDay: string) => {
    save(api<SwapRequest>('/api/swap-requests', 'POST', { fromDay, toPin, toDay, weekStart: weekStartStr(weekOffset) }))
      .then((req) => {
        if (!req) return;
        setSwapRequests((prev) => ({ ...prev, [req.id]: req }));
        flash('Swap request sent.');
      });
  }, [save, flash, weekOffset]);

  const setSwapStatus = useCallback((id: string, status: SwapRequest['status']) => {
    setSwapRequests((prev) => prev[id] ? { ...prev, [id]: { ...prev[id], status } } : prev);
  }, []);

  const respondSwap = useCallback((id: string, accept: boolean) => {
    save(api<{ status: SwapRequest['status'] }>(`/api/swap-requests/${id}`, 'PUT', { action: accept ? 'accept' : 'decline' }))
      .then((data) => { if (data) setSwapStatus(id, data.status); });
  }, [save, setSwapStatus]);

  const approveSwap = useCallback(async (id: string, approve: boolean) => {
    const req = swapRequests[id];
    const ws  = req?.weekStart || weekStartStr(weekOffset);
    const data = await save(api<{ status: SwapRequest['status'] }>(`/api/swap-requests/${id}`, 'PUT', { action: approve ? 'approve' : 'deny', weekStart: ws }));
    if (!data) return false;
    setSwapStatus(id, data.status);
    if (approve) await loadWeek(ws, false).catch(handleAuthLost);
    return true;
  }, [swapRequests, weekOffset, save, setSwapStatus, loadWeek, handleAuthLost]);

  const updateSlots = useCallback((restaurant: RestaurantKey, day: string, position: PositionKey, fn: (slots: ShiftSlot[]) => ShiftSlot[]) => {
    setShiftRequirements((prev) => {
      const dayReqs = prev[restaurant][day] ?? {};
      return { ...prev, [restaurant]: { ...prev[restaurant], [day]: { ...dayReqs, [position]: fn(dayReqs[position] ?? []) } } };
    });
  }, []);

  const addShiftSlot = useCallback((restaurant: RestaurantKey, day: string, position: PositionKey) => {
    save(api<ShiftSlot>('/api/shift-slots', 'POST', { restaurant, day, position, start: 18, end: 2 }))
      .then((slot) => { if (slot) updateSlots(restaurant, day, position, (slots) => [...slots, slot]); });
  }, [save, updateSlots]);

  const updateShiftSlot = useCallback((restaurant: RestaurantKey, day: string, position: PositionKey, id: string, field: 'start' | 'end' | 'count', value: number) => {
    updateSlots(restaurant, day, position, (slots) => slots.map((s) => s.id === id ? { ...s, [field]: value } : s));
    save(api(`/api/shift-slots/${id}`, 'PUT', { field, value }));
  }, [save, updateSlots]);

  const removeShiftSlot = useCallback((restaurant: RestaurantKey, day: string, position: PositionKey, id: string) => {
    updateSlots(restaurant, day, position, (slots) => slots.filter((s) => s.id !== id));
    save(api(`/api/shift-slots/${id}`, 'DELETE'));
  }, [save, updateSlots]);

  const autoSchedule = useCallback((restaurant: RestaurantKey): string[] => {
    const warnings: string[] = [];
    const reqs = shiftRequirements[restaurant];
    const staff = Object.entries(users).filter(([, u]) =>
      u.restaurant === restaurant && (isStaffRole(u.role) || u.role === 'manager')
    );

    const newShifts: Record<number, Record<string, Shift[]>> = {};
    for (const [pinStr] of staff) {
      const pin = Number(pinStr);
      newShifts[pin] = {};
      DAYS.forEach((d) => { newShifts[pin][d] = []; });
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
            if (avail.open) return true;
            const slotEndEff  = slot.end  < slot.start  ? slot.end  + 24 : slot.end;
            const availEndEff = avail.end < avail.start ? avail.end + 24 : avail.end;
            if (avail.start > slot.start || availEndEff < slotEndEff) return false;
            return true;
          });
          const shuffled = [...eligible].sort(() => Math.random() - 0.5);
          const toAssign = shuffled.slice(0, slot.count);
          for (const [pinStr] of toAssign) {
            const pin = Number(pinStr);
            newShifts[pin][day] = [...newShifts[pin][day], { s: slot.start, e: slot.end, position: posStr }];
            assignedPerDay[day].add(pin);
          }
          if (toAssign.length < slot.count) {
            warnings.push(`${day} · ${posStr} · ${fmtRange(slot.start, slot.end)}: need ${slot.count}, found ${toAssign.length}`);
          }
        }
      }
    }

    saveWeek(restaurant, weekStartStr(weekOffset), newShifts);
    return warnings;
  }, [shiftRequirements, availability, users, weekOffset, saveWeek]);

  const getWeekSchedule = useCallback((ws: string) => scheduleCache[ws], [scheduleCache]);

  return (
    <StoreContext.Provider value={{
      ready, users, availability, schedule, weekStart, getWeekSchedule, authUser, savedMsg, savedKind, weekOffset,
      login, loginWithCredentials, logout, setWeekOffset, setAvailDay,
      addShift, removeShift, updateShift, updateShiftPosition,
      addUser, editUser, deleteUser, flash,
      getEmployees, getManagers, getSchedulableStaff, empWeekHours,
      publishedAt, clearSchedule, publishSchedule, getComplianceWarnings,
      shiftPresets, addShiftPreset, removeShiftPreset,
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
