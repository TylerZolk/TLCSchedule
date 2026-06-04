'use client';

import { useState } from 'react';
import { DAYS, HOURS, fmtHour, fmtShort, initials, getPositionLabel, getPositionsForRestaurant, positionColorClass } from '@/lib/constants';
import { Users, Schedule, Availability, PositionKey, Shift, ShiftPreset } from '@/types';

interface Props {
  pins: number[];
  users: Users;
  schedule: Schedule;
  availability: Availability;
  weekDates: Date[];
  editable?: boolean;
  empWeekHours: (pin: number) => number;
  showCosts?: boolean;
  presets?: ShiftPreset[];
  onAddShift: (pin: number, day: string) => void;
  onRemoveShift: (pin: number, day: string, shiftId: number) => void;
  onUpdateShift: (pin: number, day: string, shiftId: number, field: 's' | 'e', value: number) => void;
  onUpdateShiftPosition: (pin: number, day: string, shiftId: number, position: PositionKey) => void;
}

interface Editing { pin: number; day: string; shiftId: number; }

// End hours reordered: 7am–11pm then 12am–6am so overnight times feel natural
const END_HOURS = [
  ...HOURS.filter((h) => h.value >= 7),
  ...HOURS.filter((h) => h.value <= 6),
];

export default function CalendarGrid({
  pins, users, schedule, availability, weekDates,
  editable = false, showCosts = false, empWeekHours,
  presets = [],
  onAddShift, onRemoveShift, onUpdateShift, onUpdateShiftPosition,
}: Props) {
  const [editing, setEditing] = useState<Editing | null>(null);
  const today = new Date();
  const isToday = (d: Date) => d.toDateString() === today.toDateString();
  const shiftDur = (sh: Shift) => sh.e > sh.s ? sh.e - sh.s : 24 - sh.s + sh.e;

  const editPin   = editing?.pin ?? null;
  const editDay   = editing?.day ?? null;
  const editUser  = editPin != null ? users[editPin] : null;
  const editSh    = editPin != null && editDay != null
    ? (schedule[editPin]?.[editDay] ?? []).find((sh) => sh.id === editing?.shiftId)
    : undefined;
  const editAv    = editPin != null && editDay != null
    ? (availability[editPin]?.[editDay] ?? { unavailable: true, open: false, start: 9, end: 17 })
    : null;

  const restaurant = pins.map((p) => users[p]?.restaurant).find(Boolean);
  const positions  = getPositionsForRestaurant(restaurant);

  const dayTotals = DAYS.map((d) =>
    pins.reduce((acc, p) => acc + (schedule[p]?.[d] ?? []).reduce((a, sh) => a + shiftDur(sh), 0), 0)
  );
  const dayPositionTotals = DAYS.map((d) =>
    positions.map((pos) => ({
      ...pos,
      count: pins.reduce((acc, p) =>
        acc + (schedule[p]?.[d] ?? []).filter((sh) => (sh.position ?? users[p]?.position) === pos.key).length, 0),
    }))
  );
  const grandTotal = dayTotals.reduce((a, b) => a + b, 0);

  const dailyCosts = showCosts ? DAYS.map((d) =>
    pins.reduce((acc, p) =>
      acc + (schedule[p]?.[d] ?? []).reduce((a, sh) => a + shiftDur(sh) * (users[p]?.wage ?? 0), 0), 0)
  ) : null;
  const totalCost = dailyCosts?.reduce((a, b) => a + b, 0) ?? 0;

  const colTemplate = '190px repeat(7, 1fr) 60px';

  return (
    <div className="bg-white border border-black/10 rounded-xl overflow-hidden mb-6 w-full">
      {positions.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-black/10 bg-white overflow-x-auto">
          <span className="text-xs font-medium text-gray-400 shrink-0">Positions</span>
          {positions.map((pos) => (
            <span key={pos.key} className={`text-[10px] font-semibold px-2 py-1 rounded-full border shrink-0 ${pos.className}`}>
              {pos.label}
            </span>
          ))}
        </div>
      )}

      <div className="overflow-x-auto">
      <div style={{ minWidth: '680px' }}>

      {/* ── Header ── */}
      <div className="grid border-b border-black/10 bg-gray-50" style={{ gridTemplateColumns: colTemplate }}>
        <div className="px-4 py-3 text-xs font-medium text-gray-400 border-r border-black/10">Employee</div>
        {DAYS.map((d, i) => (
          <div key={d} className={`py-3 text-center border-r border-black/[0.06] ${isToday(weekDates[i]) ? 'bg-[#0D6E4F]/5' : ''}`}>
            <div className={`text-xs font-medium ${isToday(weekDates[i]) ? 'text-[#0D6E4F]' : 'text-gray-400'}`}>{d}</div>
            <div className={`text-xl font-semibold leading-tight mt-0.5 ${isToday(weekDates[i]) ? 'text-[#0D6E4F]' : 'text-gray-700'}`}>
              {weekDates[i]?.getDate()}
            </div>
            {positions.length > 0 && (
              <div className="grid grid-cols-2 gap-0.5 mt-1.5 mx-auto w-fit">
                {dayPositionTotals[i].map((pos) => (
                  <span key={pos.key} className={`text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full border ${pos.className}`}>
                    {pos.count}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        <div className="px-3 py-3 text-xs font-medium text-gray-400 text-right">Total</div>
      </div>

      {/* ── Employee rows ── */}
      {pins.length === 0 && (
        <div className="py-12 text-center text-sm text-gray-400">No employees yet</div>
      )}

      {pins.map((p) => {
        const hrs  = empWeekHours(p);
        const name = users[p]?.name ?? 'Unknown';
        return (
          <div key={p} className="grid border-b border-black/[0.06] last:border-b-0 hover:bg-gray-50/50 transition-colors"
            style={{ gridTemplateColumns: colTemplate }}>

            {/* Employee info */}
            <div className="px-4 py-3 flex items-center gap-3 border-r border-black/[0.06]">
              <div className="w-9 h-9 rounded-full bg-[#E6F1FB] text-[#0C447C] flex items-center justify-center text-xs font-semibold flex-shrink-0">
                {initials(name)}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{name}</div>
                <div className="text-xs text-gray-400">
                  {users[p]?.position ? `${getPositionLabel(users[p].position)} · ${hrs}h` : `${hrs}h`}
                </div>
              </div>
            </div>

            {/* Day cells */}
            {DAYS.map((d, i) => {
              const shifts = schedule[p]?.[d] ?? [];
              const av     = availability[p]?.[d] ?? { unavailable: true, open: false, start: 9, end: 17 };
              const isUnavailable = av.unavailable && !av.open;

              return (
                <div key={d}
                  className={`relative border-r border-black/[0.04] last:border-r-0 flex flex-col items-stretch p-1 gap-1 min-h-[70px] ${isToday(weekDates[i]) ? 'bg-[#0D6E4F]/[0.02]' : ''} ${isUnavailable && shifts.length === 0 ? '' : ''}`}>

                  {/* Unavailable background when no shifts */}
                  {isUnavailable && shifts.length === 0 && (
                    <div className="absolute inset-0 rounded flex items-center justify-center"
                      style={{ background: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(0,0,0,0.03) 4px, rgba(0,0,0,0.03) 8px)' }}>
                      <span className="text-[10px] text-gray-300 font-medium">Unavailable</span>
                    </div>
                  )}

                  {/* Shift blocks */}
                  {shifts.map((sh) => (
                    <div key={sh.id}
                      onClick={() => editable && sh.id != null && setEditing({ pin: p, day: d, shiftId: sh.id! })}
                      className={`rounded-lg border-[1.5px] px-2 py-1 ${positionColorClass(sh.position ?? users[p]?.position)} ${editable ? 'cursor-pointer hover:opacity-80 transition-all' : ''} relative group`}>
                      {(sh.position ?? users[p]?.position) && (
                        <div className="text-[9px] font-semibold uppercase tracking-wide opacity-70 mb-0.5">
                          {getPositionLabel(sh.position ?? users[p]?.position)}
                        </div>
                      )}
                      <div className="text-[11px] font-medium leading-snug">
                        {fmtHour(sh.s)}–{fmtHour(sh.e)}
                      </div>
                      <div className="text-[9px] opacity-60">{shiftDur(sh)}h</div>
                      {editable && <span className="absolute top-1 right-1.5 text-[9px] opacity-0 group-hover:opacity-60 transition-opacity">✎</span>}
                    </div>
                  ))}

                  {/* Empty state / add button */}
                  {shifts.length === 0 && !isUnavailable && (
                    <div className="flex-1 flex flex-col items-center justify-center gap-1">
                      <span className="text-[11px] text-gray-300">Off</span>
                      <span className="text-[9px] text-green-600 font-medium">{av.open ? 'Open' : `${fmtShort(av.start)}–${fmtShort(av.end)}`}</span>
                    </div>
                  )}

                  {editable && (
                    <button
                      onClick={() => onAddShift(p, d)}
                      className="text-[9px] text-center py-0.5 rounded text-[#0D6E4F] hover:bg-[#0D6E4F]/10 transition-all opacity-0 hover:opacity-100 group-hover:opacity-100 relative z-10"
                      style={{ opacity: shifts.length > 0 ? undefined : 0.7 }}>
                      + Add
                    </button>
                  )}
                </div>
              );
            })}

            {/* Weekly total */}
            <div className="px-3 flex items-center justify-end">
              <span className="text-xs font-medium text-gray-600">{hrs > 0 ? `${hrs}h` : '—'}</span>
            </div>
          </div>
        );
      })}

      {/* ── Footer totals ── */}
      {pins.length > 0 && (
        <div className="grid border-t border-black/10 bg-gray-50" style={{ gridTemplateColumns: colTemplate }}>
          <div className="px-4 py-2.5 text-xs font-medium text-gray-400 border-r border-black/10">Total hours</div>
          {dayTotals.map((t, i) => (
            <div key={i} className="py-2.5 text-center text-xs font-semibold text-gray-600 border-r border-black/[0.06]">
              {t > 0 ? `${t}h` : '0h'}
            </div>
          ))}
          <div className="px-3 py-2.5 text-right text-xs font-semibold text-[#0D6E4F]">{grandTotal}h</div>
        </div>
      )}
      {showCosts && dailyCosts && (
        <div className="grid border-t border-black/10 bg-gray-50" style={{ gridTemplateColumns: colTemplate }}>
          <div className="px-4 py-2.5 text-xs font-medium text-gray-400 border-r border-black/10">Labor cost</div>
          {dailyCosts.map((cost, i) => (
            <div key={i} className="py-2.5 text-center text-xs font-semibold text-gray-600 border-r border-black/[0.06]">
              {cost > 0 ? `$${cost.toFixed(0)}` : '—'}
            </div>
          ))}
          <div className="px-3 py-2.5 text-right text-xs font-semibold text-[#0D6E4F]">${totalCost.toFixed(0)}</div>
        </div>
      )}
      </div>
      </div>

      {/* ── Shift edit modal ── */}
      {editing && editUser && editDay && editSh && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>

            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-semibold text-base">{editUser.name}</p>
                <p className="text-sm text-gray-400 mt-0.5">{editDay}</p>
              </div>
              <button onClick={() => setEditing(null)} className="text-gray-300 hover:text-gray-500 text-xl leading-none mt-0.5">✕</button>
            </div>

            {editAv && (
              editAv.unavailable ? (
                <div className="text-xs text-center py-1.5 px-3 rounded-lg mb-4 font-medium" style={{ background: '#FFEBEE', color: '#B71C1C' }}>
                  Employee marked unavailable
                </div>
              ) : editAv.open ? (
                <div className="text-xs text-center py-1.5 px-3 rounded-lg mb-4 font-medium" style={{ background: '#E8F5E9', color: '#1B5E20' }}>
                  Available any hours
                </div>
              ) : (
                <div className="text-xs text-center py-1.5 px-3 rounded-lg mb-4 font-medium" style={{ background: '#E8F5E9', color: '#1B5E20' }}>
                  Available {fmtShort(editAv.start)}–{fmtShort(editAv.end)}
                </div>
              )
            )}

            {/* Position selector */}
            {positions.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-gray-500 mb-2">Position</p>
                <div className="flex flex-wrap gap-2">
                  {positions.map((pos) => (
                    <button key={pos.key}
                      onClick={() => onUpdateShiftPosition(editing.pin, editDay, editSh.id!, pos.key)}
                      className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all border ${
                        (editSh.position ?? editUser.position) === pos.key
                          ? pos.className
                          : 'bg-gray-50 text-gray-400 border-black/10 hover:bg-gray-100'
                      }`}>
                      {pos.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Presets */}
            {presets.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-gray-500 mb-2">Quick select</p>
                <div className="flex flex-wrap gap-2">
                  {presets.map((p) => (
                    <button key={p.id}
                      onClick={() => {
                        onUpdateShift(editing!.pin, editDay, editSh.id!, 's', p.start);
                        onUpdateShift(editing!.pin, editDay, editSh.id!, 'e', p.end);
                        if (p.position) onUpdateShiftPosition(editing!.pin, editDay, editSh.id!, p.position);
                      }}
                      className="text-xs px-3 py-1.5 rounded-lg bg-gray-50 border border-black/10 text-gray-600 hover:bg-[#0D6E4F]/10 hover:border-[#0D6E4F]/30 hover:text-[#0D6E4F] transition-all">
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Time selectors */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1.5">Start</p>
                <select value={editSh.s}
                  onChange={(e) => onUpdateShift(editing.pin, editDay, editSh.id!, 's', parseInt(e.target.value))}
                  className="w-full text-sm py-2.5 px-3 rounded-xl border border-black/10 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0D6E4F]/20">
                  {HOURS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
                </select>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1.5">End</p>
                <select value={editSh.e}
                  onChange={(e) => onUpdateShift(editing.pin, editDay, editSh.id!, 'e', parseInt(e.target.value))}
                  className="w-full text-sm py-2.5 px-3 rounded-xl border border-black/10 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0D6E4F]/20">
                  {END_HOURS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
                </select>
              </div>
            </div>

            <p className="text-xs text-center text-gray-400 mb-5">{shiftDur(editSh)}h shift</p>

            <div className="flex gap-2">
              <button onClick={() => setEditing(null)}
                className="flex-1 py-2.5 rounded-xl bg-[#0D6E4F] text-white text-sm font-medium hover:opacity-90 transition-all">
                Done
              </button>
              <button onClick={() => { onRemoveShift(editing.pin, editDay, editSh.id!); setEditing(null); }}
                className="flex-1 py-2.5 rounded-xl border border-red-200 text-sm text-red-600 hover:bg-red-50 transition-all">
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
