'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { getWeekDates, weekLabel, RESTAURANTS, buildLaborSummary } from '@/lib/constants';
import { SectionHeader, WeekNav } from '@/components/SectionHeader';
import CalendarGrid from '@/components/CalendarGrid';
import CompliancePanel from '@/components/CompliancePanel';
import { RestaurantKey } from '@/types';

export default function OwnerSchedule() {
  const {
    users, schedule, availability, weekOffset, setWeekOffset,
    addShift, removeShift, updateShift, updateShiftPosition, flash, empWeekHours,
    getSchedulableStaff, autoSchedule, clearSchedule, publishedAt, publishSchedule, getComplianceWarnings,
    shiftPresets,
  } = useStore();

  const [restaurant, setRestaurant] = useState<RestaurantKey>('tlc');
  const [warnings,   setWarnings]   = useState<string[]>([]);

  const dates   = getWeekDates(weekOffset);
  const empPins = getSchedulableStaff(restaurant).map(([p]) => Number(p));

  const complianceWarnings = getComplianceWarnings(restaurant);
  const labor = buildLaborSummary(restaurant, empPins, users, schedule);

  function handleAutoSchedule() {
    const w = autoSchedule(restaurant);
    setWarnings(w);
    if (w.length === 0) flash('Schedule auto-filled successfully!');
  }

  async function handlePublish() {
    if (await publishSchedule(restaurant)) flash('Schedule published to employees!');
  }

  return (
    <>
      <SectionHeader title="Build Schedule" sub={`${weekLabel(dates)} · Click a shift to edit hours · Use "+ Add" to add a shift`}>
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

      <div className="flex gap-2 mb-5">
        {Object.entries(RESTAURANTS).map(([rk, r]) => (
          <button key={rk} onClick={() => { setRestaurant(rk as RestaurantKey); setWarnings([]); }}
            className={`text-sm px-4 py-1.5 rounded-full font-medium transition-all ${
              restaurant === rk ? r.badgeClass : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}>
            {r.name}
          </button>
        ))}
      </div>

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
        presets={shiftPresets[restaurant] ?? []}
        onAddShift={addShift}
        onRemoveShift={removeShift}
        onUpdateShift={updateShift}
        onUpdateShiftPosition={updateShiftPosition}
      />

      <CompliancePanel warnings={complianceWarnings} labor={labor} users={users} />
    </>
  );
}
