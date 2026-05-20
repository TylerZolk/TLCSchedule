'use client';

import { useStore } from '@/lib/store';
import { RESTAURANTS, getWeekDates, weekLabel } from '@/lib/constants';
import { SectionHeader, WeekNav } from '@/components/SectionHeader';
import CalendarGrid from '@/components/CalendarGrid';

export default function AllSchedules() {
  const { users, schedule, availability, weekOffset, setWeekOffset, setShift, setShiftPosition, toggleOff, empWeekHours, getSchedulableStaff } = useStore();
  const dates = getWeekDates(weekOffset);

  return (
    <>
      <SectionHeader title="All schedules" sub={weekLabel(dates)}>
        <WeekNav weekOffset={weekOffset} onChange={setWeekOffset} />
      </SectionHeader>

      <div className="space-y-8">
        {Object.entries(RESTAURANTS).map(([rk, r]) => {
          const empPins = getSchedulableStaff(rk).map(([p]) => Number(p));
          return (
            <div key={rk}>
              <div className="mb-3">
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${r.badgeClass}`}>{r.name}</span>
              </div>
              <CalendarGrid
                pins={empPins}
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
            </div>
          );
        })}
      </div>
    </>
  );
}
