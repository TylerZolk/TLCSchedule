'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { getWeekDates, weekLabel, RESTAURANTS, buildLaborSummary } from '@/lib/constants';
import { SectionHeader, WeekNav } from '@/components/SectionHeader';
import CalendarGrid from '@/components/CalendarGrid';
import CompliancePanel from '@/components/CompliancePanel';
import { RestaurantKey, SwapRequest } from '@/types';
import { fmtRange } from '@/lib/constants';

export default function ManagerSchedule() {
  const {
    authUser, users, schedule, availability, weekOffset, setWeekOffset,
    setShift, setShiftPosition, toggleOff, flash, empWeekHours,
    getSchedulableStaff, autoSchedule, clearSchedule, publishedAt, publishSchedule, getComplianceWarnings,
    swapRequests, approveSwap,
  } = useStore();

  const [warnings, setWarnings] = useState<string[]>([]);
  const restaurant = authUser!.restaurant! as RestaurantKey;
  const dates      = getWeekDates(weekOffset);
  const rest       = RESTAURANTS[restaurant];
  const empPins    = getSchedulableStaff(restaurant).map(([p]) => Number(p));

  const pendingSwaps = Object.values(swapRequests).filter((r): r is SwapRequest =>
    r.status === 'awaiting_approval' &&
    (users[r.fromPin]?.restaurant === restaurant || users[r.toPin]?.restaurant === restaurant)
  );

  const complianceWarnings = getComplianceWarnings(restaurant);
  const labor = buildLaborSummary(restaurant, empPins, users, schedule);

  function handleAutoSchedule() {
    const w = autoSchedule(restaurant);
    setWarnings(w);
    if (w.length === 0) flash('Schedule auto-filled successfully!');
  }

  function handlePublish() {
    publishSchedule(restaurant);
    flash('Schedule published to employees!');
  }

  return (
    <>
      <SectionHeader title={`${rest.name} — Schedule`} sub={weekLabel(dates)}>
        <WeekNav weekOffset={weekOffset} onChange={setWeekOffset} />
        <button onClick={handleAutoSchedule}
          className="px-4 py-2 text-sm font-medium bg-white border border-black/15 text-gray-700 rounded-lg hover:bg-gray-50 transition-all">
          Auto-Schedule
        </button>
        <button onClick={() => { if (confirm('Clear all shifts for this week?')) { clearSchedule(restaurant); flash('Schedule cleared.'); } }}
          className="px-4 py-2 text-sm font-medium border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-all">
          Clear
        </button>
        <div className="flex flex-col items-end gap-0.5">
          <button onClick={handlePublish}
            className="px-4 py-2 text-sm font-medium bg-[#0D6E4F] text-white rounded-lg hover:opacity-90 transition-all">
            Publish
          </button>
          {publishedAt[restaurant] ? (
            <span className="text-[10px] text-gray-400">
              Published {publishedAt[restaurant]!.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          ) : (
            <span className="text-[10px] text-amber-500">Not yet published</span>
          )}
        </div>
      </SectionHeader>

      {warnings.length > 0 && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-amber-800 mb-1">Some shifts couldn't be fully filled</p>
              <ul className="space-y-0.5">
                {warnings.map((w, i) => <li key={i} className="text-xs text-amber-700">{w}</li>)}
              </ul>
            </div>
            <button onClick={() => setWarnings([])} className="text-amber-400 hover:text-amber-600 text-lg leading-none">✕</button>
          </div>
        </div>
      )}

      <CalendarGrid
        pins={empPins}
        users={users}
        schedule={schedule}
        availability={availability}
        weekDates={dates}
        editable={true}
        showCosts={true}
        empWeekHours={empWeekHours}
        onSetShift={setShift}
        onSetShiftPosition={setShiftPosition}
        onToggleOff={toggleOff}
      />

      {pendingSwaps.length > 0 && (
        <div className="bg-white border border-black/10 rounded-xl overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-black/8 bg-blue-50">
            <p className="text-sm font-semibold text-blue-800">
              Shift Swap Approvals
              <span className="ml-2 text-xs font-bold bg-blue-500 text-white px-2 py-0.5 rounded-full">{pendingSwaps.length}</span>
            </p>
          </div>
          <div className="divide-y divide-black/5">
            {pendingSwaps.map((req) => {
              const from   = users[req.fromPin];
              const to     = users[req.toPin];
              const fromSh = schedule[req.fromPin]?.[req.fromDay];
              const toSh   = schedule[req.toPin]?.[req.toDay];
              return (
                <div key={req.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 mb-1.5">
                      {from?.name} ↔ {to?.name}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <span className="px-2 py-1 bg-gray-100 rounded-lg">
                        {from?.name.split(' ')[0]}'s {req.fromDay}: {fromSh ? fmtRange(fromSh.s, fromSh.e) : 'Off'}
                      </span>
                      <span>↔</span>
                      <span className="px-2 py-1 bg-gray-100 rounded-lg">
                        {to?.name.split(' ')[0]}'s {req.toDay}: {toSh ? fmtRange(toSh.s, toSh.e) : 'Off'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => { approveSwap(req.id, true); flash('Swap approved.'); }}
                      className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-[#0D6E4F] text-white text-xs font-medium hover:opacity-90 transition-all">
                      Approve
                    </button>
                    <button onClick={() => { approveSwap(req.id, false); flash('Swap denied.'); }}
                      className="flex-1 sm:flex-none px-4 py-2 rounded-lg border border-black/10 text-xs text-gray-600 hover:bg-gray-50 transition-all">
                      Deny
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <CompliancePanel warnings={complianceWarnings} labor={labor} users={users} />
    </>
  );
}
