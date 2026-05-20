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
  onSetShift: (pin: number, day: string, field: 's' | 'e', value: number) => void;
  onSetShiftPosition: (pin: number, day: string, position: PositionKey) => void;
  onToggleOff: (pin: number, day: string) => void;
}

interface Editing { pin: number; day: string; }

export default function CalendarGrid({
  pins, users, schedule, availability, weekDates,
  editable = false, empWeekHours, onSetShift, onSetShiftPosition, onToggleOff,
}: Props) {
  const [editing, setEditing] = useState<Editing | null>(null);
  const today = new Date();
  const isToday = (d: Date) => d.toDateString() === today.toDateString();

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
              const sh  = schedule[p]?.[d];
              const av  = availability[p]?.[d] ?? { unavailable: false, start: 9, end: 17 };
              const isEd = editable && editing?.pin === p && editing?.day === d;

              return (
                <div key={d}
                  className={`relative border-r border-black/[0.04] last:border-r-0 flex items-center justify-center p-1.5 min-h-[70px] ${isToday(weekDates[i]) ? 'bg-[#0D6E4F]/[0.02]' : ''}`}>

                  {/* Inline shift editor */}
                  {isEd ? (
                    <div className="absolute inset-1 bg-white border border-black/10 rounded-lg p-2 z-10 shadow-sm flex flex-col gap-1">
                      <div className="text-[10px] font-medium text-gray-400 mb-0.5">{name.split(' ')[0]} — {d}</div>

                      {/* Availability info */}
                      {av.unavailable ? (
                        <div className="text-[9px] text-center py-0.5 rounded" style={{ background: '#FFEBEE', color: '#B71C1C' }}>Employee unavailable</div>
                      ) : (
                        <div className="text-[9px] text-center py-0.5 rounded" style={{ background: '#E8F5E9', color: '#1B5E20' }}>
                          Avail: {fmtShort(av.start)}–{fmtShort(av.end)}
                        </div>
                      )}

                      {/* Time selectors */}
                      {sh && (
                        <>
                          {positions.length > 0 && (
                            <select value={sh.position ?? users[p]?.position ?? positions[0].key}
                              onChange={(e) => onSetShiftPosition(p, d, e.target.value as PositionKey)}
                              className="w-full text-[10px] p-1 rounded border border-black/10 bg-gray-50 focus:outline-none">
                              {positions.map((pos) => <option key={pos.key} value={pos.key}>{pos.label}</option>)}
                            </select>
                          )}
                          <div className="flex items-center gap-1 mt-0.5">
                            <select value={sh.s} onChange={(e) => onSetShift(p, d, 's', parseInt(e.target.value))}
                              className="flex-1 min-w-0 text-[10px] p-1 rounded border border-black/10 bg-gray-50 focus:outline-none">
                              {HOURS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
                            </select>
                            <span className="text-[9px] text-gray-300">–</span>
                            <select value={sh.e} onChange={(e) => onSetShift(p, d, 'e', parseInt(e.target.value))}
                              className="flex-1 min-w-0 text-[10px] p-1 rounded border border-black/10 bg-gray-50 focus:outline-none">
                              {HOURS.filter((h) => h.value > sh.s).map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
                            </select>
                          </div>
                          <div className="text-[9px] text-center text-gray-400">{sh.e - sh.s}h shift</div>
                        </>
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-1 mt-auto">
                        <button onClick={() => setEditing(null)}
                          className="flex-1 text-[9px] font-medium py-1 rounded bg-[#0D6E4F] text-white hover:opacity-90 transition-all">
                          {sh ? 'Done' : 'Close'}
                        </button>
                        <button onClick={() => { onToggleOff(p, d); setEditing(null); }}
                          className="flex-1 text-[9px] py-1 rounded border border-black/10 hover:bg-gray-100 transition-all">
                          {sh ? 'Set Off' : 'Add Shift'}
                        </button>
                      </div>
                    </div>
                  ) : av.unavailable ? (
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
                        <button onClick={() => setEditing({ pin: p, day: d })}
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
    </div>
  );
}
