'use client';

import { useStore } from '@/lib/store';
import { getWeekDates, weekLabel } from '@/lib/constants';
import { SectionHeader, WeekNav } from '@/components/SectionHeader';
import CalendarGrid from '@/components/CalendarGrid';

export default function MySchedule() {
  const { authUser, users, schedule, availability, weekOffset, setWeekOffset, setShift, setShiftPosition, toggleOff, empWeekHours } = useStore();
  const dates = getWeekDates(weekOffset);

  return (
    <>
      <SectionHeader title="My schedule" sub={weekLabel(dates)}>
        <WeekNav weekOffset={weekOffset} onChange={setWeekOffset} />
      </SectionHeader>
      <CalendarGrid
        pins={[authUser!.pin]}
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
    </>
  );
}
