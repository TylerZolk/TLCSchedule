'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { getWeekDates, weekLabel, RESTAURANTS } from '@/lib/constants';
import { SectionHeader, WeekNav } from '@/components/SectionHeader';
import CalendarGrid from '@/components/CalendarGrid';
import { RestaurantKey } from '@/types';

export default function ManagerSchedule() {
  const { authUser, users, schedule, availability, weekOffset, setWeekOffset, setShift, setShiftPosition, toggleOff, flash, empWeekHours, getSchedulableStaff, autoSchedule } = useStore();
  const [warnings, setWarnings] = useState<string[]>([]);
  const dates   = getWeekDates(weekOffset);
  const rest    = RESTAURANTS[authUser!.restaurant!];
  const empPins = getSchedulableStaff(authUser!.restaurant!).map(([p]) => Number(p));

  function handleAutoSchedule() {
    const w = autoSchedule(authUser!.restaurant! as RestaurantKey);
    setWarnings(w);
    if (w.length === 0) flash('Schedule auto-filled successfully!');
  }

  return (
    <>
      <SectionHeader title={`${rest.name} — Schedule`} sub={`${weekLabel(dates)} · Click a shift to edit hours · Click "Off" to add a shift`}>
        <WeekNav weekOffset={weekOffset} onChange={setWeekOffset} />
        <button onClick={handleAutoSchedule}
          className="px-4 py-2 text-sm font-medium bg-white border border-black/15 text-gray-700 rounded-lg hover:bg-gray-50 transition-all">
          Auto-Schedule
        </button>
        <button onClick={() => flash('Schedule published to employees!')}
          className="px-4 py-2 text-sm font-medium bg-[#0D6E4F] text-white rounded-lg hover:opacity-90 transition-all">
          Publish
        </button>
      </SectionHeader>

      {warnings.length > 0 && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-amber-800 mb-1">Some shifts couldn't be fully filled</p>
              <ul className="space-y-0.5">
                {warnings.map((w, i) => (
                  <li key={i} className="text-xs text-amber-700">{w}</li>
                ))}
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
        empWeekHours={empWeekHours}
        onSetShift={setShift}
        onSetShiftPosition={setShiftPosition}
        onToggleOff={toggleOff}
      />
    </>
  );
}
