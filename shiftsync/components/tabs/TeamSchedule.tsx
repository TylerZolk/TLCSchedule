'use client';

import { useStore } from '@/lib/store';
import { getWeekDates, weekLabel, RESTAURANTS } from '@/lib/constants';
import { SectionHeader, WeekNav } from '@/components/SectionHeader';
import CalendarGrid from '@/components/CalendarGrid';

export default function TeamSchedule() {
  const {
    authUser,
    users,
    schedule,
    availability,
    weekOffset,
    setWeekOffset,
    setShift,
    setShiftPosition,
    toggleOff,
    empWeekHours,
    getSchedulableStaff,
  } = useStore();
  const weekDates = getWeekDates(weekOffset);
  const rest = RESTAURANTS[authUser!.restaurant!];
  const empPins = getSchedulableStaff(authUser!.restaurant!).map(([p]) => Number(p));

  return (
    <>
      <SectionHeader title={`${rest.name} - Team schedule`} sub={weekLabel(weekDates)}>
        <WeekNav weekOffset={weekOffset} onChange={setWeekOffset} />
      </SectionHeader>
      <CalendarGrid
        pins={empPins}
        users={users}
        schedule={schedule}
        availability={availability}
        weekDates={weekDates}
        editable={false}
        empWeekHours={empWeekHours}
        onSetShift={setShift}
        onSetShiftPosition={setShiftPosition}
        onToggleOff={toggleOff}
      />
    </>
  );
}
