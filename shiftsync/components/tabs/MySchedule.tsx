'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { DAYS, getWeekDates, weekLabel, fmtRange, getPositionLabel } from '@/lib/constants';
import { SectionHeader, WeekNav } from '@/components/SectionHeader';
import CalendarGrid from '@/components/CalendarGrid';

export default function MySchedule() {
  const {
    authUser, users, schedule, availability, weekOffset, setWeekOffset,
    setShift, setShiftPosition, toggleOff, empWeekHours,
    swapRequests, requestSwap, respondSwap, getSchedulableStaff,
  } = useStore();

  const dates   = getWeekDates(weekOffset);
  const myPin   = authUser!.pin;
  const myShifts = DAYS.filter((d) => schedule[myPin]?.[d] != null);

  // Swap dialog state
  const [swapDialog, setSwapDialog] = useState<{ offerDay: string } | null>(null);
  const [toPin, setToPin]           = useState<number | ''>('');
  const [toDay, setToDay]           = useState<string>('');

  const colleagues = getSchedulableStaff(authUser!.restaurant!)
    .filter(([p]) => Number(p) !== myPin);

  const colleagueShiftDays = toPin !== ''
    ? DAYS.filter((d) => schedule[Number(toPin)]?.[d] != null)
    : [];

  function submitSwap() {
    if (!swapDialog || toPin === '' || !toDay) return;
    requestSwap(myPin, swapDialog.offerDay, Number(toPin), toDay);
    setSwapDialog(null);
    setToPin('');
    setToDay('');
  }

  const incoming = Object.values(swapRequests).filter(
    (r) => r.toPin === myPin && (r.status === 'pending' || r.status === 'awaiting_approval')
  );
  const outgoing = Object.values(swapRequests).filter(
    (r) => r.fromPin === myPin
  );

  return (
    <>
      <SectionHeader title="My Schedule" sub={weekLabel(dates)}>
        <WeekNav weekOffset={weekOffset} onChange={setWeekOffset} />
      </SectionHeader>

      <CalendarGrid
        pins={[myPin]}
        users={users}
        schedule={schedule}
        availability={availability}
        weekDates={dates}
        editable={false}
        empWeekHours={empWeekHours}
        onSetShift={setShift}
        onSetShiftPosition={setShiftPosition}
        onToggleOff={toggleOff}
      />

      {/* ── Shift swap section ── */}
      {myShifts.length > 0 && (
        <div className="bg-white border border-black/10 rounded-xl overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-black/8 bg-gray-50">
            <p className="text-sm font-semibold">Request a Shift Swap</p>
            <p className="text-xs text-gray-400 mt-0.5">Offer one of your shifts and pick a colleague's shift to swap with</p>
          </div>
          <div className="divide-y divide-black/5">
            {myShifts.map((day) => {
              const sh = schedule[myPin]![day]!;
              return (
                <div key={day} className="flex items-center justify-between px-5 py-3 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-800">{day}</span>
                    <span className="text-xs text-gray-400 ml-2">
                      {fmtRange(sh.s, sh.e)} · {getPositionLabel(sh.position ?? authUser!.position)}
                    </span>
                  </div>
                  <button
                    onClick={() => { setSwapDialog({ offerDay: day }); setToPin(''); setToDay(''); }}
                    className="text-xs px-3 py-1.5 rounded-lg border border-black/10 text-gray-600 hover:bg-gray-50 transition-all whitespace-nowrap"
                  >
                    ↔ Request Swap
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Incoming requests ── */}
      {incoming.length > 0 && (
        <div className="bg-white border border-black/10 rounded-xl overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-black/8 bg-amber-50">
            <p className="text-sm font-semibold text-amber-800">Incoming Swap Requests</p>
          </div>
          <div className="divide-y divide-black/5">
            {incoming.map((req) => {
              const from     = users[req.fromPin];
              const fromSh   = schedule[req.fromPin]?.[req.fromDay];
              const toSh     = schedule[req.toPin]?.[req.toDay];
              return (
                <div key={req.id} className="px-5 py-4">
                  <p className="text-sm font-medium mb-1">{from?.name} wants to swap shifts</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <span className="px-2 py-1 bg-gray-100 rounded-lg">
                      Their {req.fromDay}: {fromSh ? fmtRange(fromSh.s, fromSh.e) : 'Off'}
                    </span>
                    <span>↔</span>
                    <span className="px-2 py-1 bg-gray-100 rounded-lg">
                      Your {req.toDay}: {toSh ? fmtRange(toSh.s, toSh.e) : 'Off'}
                    </span>
                  </div>
                  {req.status === 'pending' ? (
                    <div className="flex gap-2">
                      <button onClick={() => respondSwap(req.id, true)}
                        className="px-4 py-1.5 rounded-lg bg-[#0D6E4F] text-white text-xs font-medium hover:opacity-90 transition-all">
                        Accept
                      </button>
                      <button onClick={() => respondSwap(req.id, false)}
                        className="px-4 py-1.5 rounded-lg border border-black/10 text-xs text-gray-600 hover:bg-gray-50 transition-all">
                        Decline
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-blue-600 font-medium">Awaiting manager approval</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Outgoing requests ── */}
      {outgoing.length > 0 && (
        <div className="bg-white border border-black/10 rounded-xl overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-black/8 bg-gray-50">
            <p className="text-sm font-semibold">Sent Swap Requests</p>
          </div>
          <div className="divide-y divide-black/5">
            {outgoing.map((req) => {
              const to   = users[req.toPin];
              const mySh = schedule[req.fromPin]?.[req.fromDay];
              const theirSh = schedule[req.toPin]?.[req.toDay];
              const badge =
                req.status === 'accepted'          ? 'bg-green-100 text-green-700' :
                req.status === 'declined'          ? 'bg-red-100 text-red-600' :
                req.status === 'awaiting_approval' ? 'bg-blue-100 text-blue-700' :
                'bg-amber-100 text-amber-700';
              const badgeLabel =
                req.status === 'awaiting_approval' ? 'pending manager' : req.status;
              return (
                <div key={req.id} className="px-5 py-3 flex items-center justify-between gap-4">
                  <div className="text-xs text-gray-500">
                    <span className="font-medium text-gray-700">{to?.name}</span>
                    {' · '}Your {req.fromDay} ({mySh ? fmtRange(mySh.s, mySh.e) : 'Off'})
                    {' ↔ '}
                    Their {req.toDay} ({theirSh ? fmtRange(theirSh.s, theirSh.e) : 'Off'})
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${badge}`}>
                    {badgeLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Swap request dialog ── */}
      {swapDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSwapDialog(null)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="font-semibold text-base">Request Shift Swap</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Offering your <span className="font-medium text-gray-700">{swapDialog.offerDay}</span> shift
                </p>
              </div>
              <button onClick={() => setSwapDialog(null)} className="text-gray-300 hover:text-gray-500 text-xl leading-none mt-0.5">✕</button>
            </div>

            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 mb-1.5">Swap with</p>
              <select
                value={toPin}
                onChange={(e) => { setToPin(e.target.value === '' ? '' : Number(e.target.value)); setToDay(''); }}
                className="w-full text-sm py-2.5 px-3 rounded-xl border border-black/10 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0D6E4F]/20"
              >
                <option value="">Select a colleague…</option>
                {colleagues.map(([p, u]) => (
                  <option key={p} value={p}>{u.name}</option>
                ))}
              </select>
            </div>

            {toPin !== '' && (
              <div className="mb-5">
                <p className="text-xs font-medium text-gray-500 mb-1.5">Their shift to take</p>
                {colleagueShiftDays.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">This colleague has no shifts scheduled</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {colleagueShiftDays.map((day) => {
                      const sh = schedule[Number(toPin)]![day]!;
                      return (
                        <button key={day}
                          onClick={() => setToDay(day)}
                          className={`text-xs px-3 py-2 rounded-xl border transition-all ${
                            toDay === day
                              ? 'bg-[#0D6E4F] text-white border-[#0D6E4F]'
                              : 'border-black/10 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <span className="font-medium">{day}</span>
                          <span className="ml-1 opacity-70">{fmtRange(sh.s, sh.e)}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={submitSwap}
              disabled={toPin === '' || !toDay}
              className="w-full py-2.5 rounded-xl bg-[#0D6E4F] text-white text-sm font-medium hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Send Request
            </button>
          </div>
        </div>
      )}
    </>
  );
}
