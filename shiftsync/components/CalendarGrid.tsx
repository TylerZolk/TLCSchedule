'use client';

import { useState } from 'react';
import { DAYS, HOURS, fmtHour, fmtShort, initials, getPositionLabel, getPositionsForRestaurant, positionColorClass } from '@/lib/constants';
import { Users, Schedule, Availability, PositionKey } from '@/types';

interface Props {
  pins: number[];
  users: Users;
  schedule: Schedule;
  availability: Availability;
  weekDates: Date[];
  editable?: boolean;
  empWeekHours: (pin: number) => number;
  showCosts?: boolean;
  onSetShift: (pin: number, day: string, field: 's' | 'e', value: number) => void;
  onSetShiftPosition: (pin: number, day: string, position: PositionKey) => void;
  onToggleOff: (pin: number, day: string) => void;
}

interface Editing { pin: number; day: string; }

export default function CalendarGrid({
  pins, users, schedule, availability, weekDates,
  editable = false, showCosts = false, empWeekHours, onSetShift, onSetShiftPosition, onToggleOff,
}: Props) {
  const [editing, setEditing] = useState<Editing | null>(null);
  const today = new Date();
  const isToday = (d: Date) => d.toDateString() === today.toDateString();

  // Derive modal data
  const editPin  = editing?.pin ?? null;
  const editDay  = editing?.day ?? null;
  const editUser = editPin != null ? users[editPin] : null;
  const editSh   = editPin != null && editDay != null ? schedule[editPin]?.[editDay] : undefined;
  const editAv   = editPin != null && editDay != null
    ? (availability[editPin]?.[editDay] ?? { unavailable: false, start: 9, end: 17 })
    : null;

  const dayTotals = DAYS.map((d) =>
    pins.reduce((acc, p) => { const sh = schedule[p]?.[d]; return acc + (sh ? sh.e - sh.s : 0); }, 0)
  );
  const restaurant = pins.map((p) => users[p]?.restaurant).find(Boolean);
  const positions = getPositionsForRestaurant(restaurant);
  const dayPositionTotals = DAYS.map((d) =>
    positions.map((pos) => ({
      ...pos,
      count: pins.filter((p) => {
        const sh = schedule[p]?.[d];
        return sh && (sh.position ?? users[p]?.position) === pos.key;
      }).length,
    }))
  );
  const grandTotal = dayTotals.reduce((a, b) => a + b, 0);
  const shiftDur = (sh: { s: number; e: number }) => sh.e > sh.s ? sh.e - sh.s : 24 - sh.s + sh.e;
  const dailyCosts = showCosts ? DAYS.map((d) =>
    pins.reduce((acc, p) => {
      const sh = schedule[p]?.[d];
      return acc + (sh ? shiftDur(sh) * (users[p]?.wage ?? 0) : 0);
    }, 0)
  ) : null;
  const totalCost = dailyCosts?.reduce((a, b) => a + b, 0) ?? 0;

  const colTemplate = '190px repeat(7, 1fr) 60px';

  return (
    <div className="bg-white border border-black/10 rounded-xl overflow-hidden mb-6 w-full">
      {positions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-black/10 bg-white">
          <span className="text-xs font-medium text-gray-400 mr-1">Positions</span>
          {positions.map((pos) => (
            <span key={pos.key} className={`text-[10px] font-semibold px-2 py-1 rounded-full border ${pos.className}`}>
              {pos.label}
            </span>
          ))}
        </div>
      )}
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
              <div className="flex flex-wrap justify-center gap-1 mt-2 px-1">
                {dayPositionTotals[i].map((pos) => (
                  <span key={pos.key} className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${pos.className}`}>
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
        const hrs = empWeekHours(p);
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
                  {users[p]?.position ? `${getPositionLabel(users[p].position)} - ${hrs}h` : `${hrs}h`}
                </div>
              </div>
            </div>

            {/* Day cells */}
            {DAYS.map((d, i) => {
              const sh = schedule[p]?.[d];
              const av = availability[p]?.[d] ?? { unavailable: false, start: 9, end: 17 };

              return (
                <div key={d}
                  className={`relative border-r border-black/[0.04] last:border-r-0 flex items-center justify-center p-1.5 min-h-[70px] ${isToday(weekDates[i]) ? 'bg-[#0D6E4F]/[0.02]' : ''}`}>

                  {av.unavailable ? (
                    /* Unavailable — hatched */
                    <div className="w-full h-full flex items-center justify-center rounded-lg"
                      style={{ background: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(0,0,0,0.03) 4px, rgba(0,0,0,0.03) 8px)' }}>
                      <span className="text-[10px] text-gray-300 font-medium">Unavailable</span>
                    </div>
                  ) : sh ? (
                    /* Scheduled shift block */
                    <div
                      onClick={() => editable && setEditing({ pin: p, day: d })}
                      className={`w-full rounded-lg border-[1.5px] px-2 py-1.5 ${positionColorClass(sh.position ?? users[p]?.position)} ${editable ? 'cursor-pointer hover:opacity-80 transition-all' : ''} relative group`}>
                      {(sh.position ?? users[p]?.position) && (
                        <div className="text-[9px] font-semibold uppercase tracking-wide opacity-70 mb-0.5">
                          {getPositionLabel(sh.position ?? users[p]?.position)}
                        </div>
                      )}
                      <div className="text-[11px] font-medium leading-snug">
                        {fmtHour(sh.s)}<br />{fmtHour(sh.e)}
                      </div>
                      <div className="text-[9px] opacity-60">{sh.e - sh.s}h</div>
                      {editable && (
                        <span className="absolute top-1 right-1.5 text-[9px] opacity-0 group-hover:opacity-60 transition-opacity">✎</span>
                      )}
                    </div>
                  ) : (
                    /* Off day */
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1 relative">
                      <span className="text-[11px] text-gray-300">Off</span>
                      {editable && (
                        <button onClick={() => { onToggleOff(p, d); setEditing({ pin: p, day: d }); }}
                          className="text-[9px] px-2 py-0.5 rounded bg-[#0D6E4F]/10 text-[#0D6E4F] hover:bg-[#0D6E4F]/20 transition-all">
                          + Add shift
                        </button>
                      )}
                      {/* subtle availability bar */}
                      <div className="absolute bottom-1.5 left-2 right-2 h-0.5 rounded-full bg-green-100" />
                    </div>
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
      {/* ── Shift edit modal ── */}
      {editing && editUser && editDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-semibold text-base">{editUser.name}</p>
                <p className="text-sm text-gray-400 mt-0.5">{editDay}</p>
              </div>
              <button onClick={() => setEditing(null)} className="text-gray-300 hover:text-gray-500 transition-colors text-xl leading-none mt-0.5">✕</button>
            </div>

            {/* Availability badge */}
            {editAv && (
              editAv.unavailable ? (
                <div className="text-xs text-center py-1.5 px-3 rounded-lg mb-4 font-medium" style={{ background: '#FFEBEE', color: '#B71C1C' }}>
                  Employee marked unavailable
                </div>
              ) : (
                <div className="text-xs text-center py-1.5 px-3 rounded-lg mb-4 font-medium" style={{ background: '#E8F5E9', color: '#1B5E20' }}>
                  Available {fmtShort(editAv.start)}–{fmtShort(editAv.end)}
                </div>
              )
            )}

            {editSh ? (
              <>
                {/* Position selector */}
                {positions.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-500 mb-2">Position</p>
                    <div className="flex flex-wrap gap-2">
                      {positions.map((pos) => (
                        <button key={pos.key}
                          onClick={() => onSetShiftPosition(editing.pin, editDay, pos.key)}
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

                {/* Time selectors */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1.5">Start</p>
                    <select value={editSh.s}
                      onChange={(e) => onSetShift(editing.pin, editDay, 's', parseInt(e.target.value))}
                      className="w-full text-sm py-2.5 px-3 rounded-xl border border-black/10 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0D6E4F]/20">
                      {HOURS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1.5">End</p>
                    <select value={editSh.e}
                      onChange={(e) => onSetShift(editing.pin, editDay, 'e', parseInt(e.target.value))}
                      className="w-full text-sm py-2.5 px-3 rounded-xl border border-black/10 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0D6E4F]/20">
                      {HOURS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
                    </select>
                  </div>
                </div>

                <p className="text-xs text-center text-gray-400 mb-5">{editSh.e - editSh.s}h shift</p>

                <div className="flex gap-2">
                  <button onClick={() => setEditing(null)}
                    className="flex-1 py-2.5 rounded-xl bg-[#0D6E4F] text-white text-sm font-medium hover:opacity-90 transition-all">
                    Done
                  </button>
                  <button onClick={() => { onToggleOff(editing.pin, editDay); setEditing(null); }}
                    className="flex-1 py-2.5 rounded-xl border border-black/10 text-sm text-gray-600 hover:bg-gray-50 transition-all">
                    Set Off
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
