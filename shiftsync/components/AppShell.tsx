'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { RESTAURANTS } from '@/lib/constants';
import Topbar from '@/components/Topbar';
import SaveBanner from '@/components/SaveBanner';

import MySchedule      from '@/components/tabs/MySchedule';
import MyAvailability  from '@/components/tabs/MyAvailability';
import TeamSchedule    from '@/components/tabs/TeamSchedule';
import ManagerSchedule from '@/components/tabs/ManagerSchedule';
import TeamAvailability from '@/components/tabs/TeamAvailability';
import ShiftTemplate   from '@/components/tabs/ShiftTemplate';
import ShiftPresets    from '@/components/tabs/ShiftPresets';
import ManageStaff     from '@/components/tabs/ManageStaff';
import OwnerOverview   from '@/components/tabs/OwnerOverview';
import OwnerSchedule   from '@/components/tabs/OwnerSchedule';
import AllSchedules    from '@/components/tabs/AllSchedules';

type TabId = 'my-schedule' | 'my-avail' | 'team-schedule' | 'mgr-schedule' | 'team-avail' | 'shift-template' | 'shift-presets' | 'staff' | 'overview' | 'build-schedule' | 'all-schedules' | 'all-staff' | 'owner-avail' | 'owner-template' | 'owner-presets';
interface TabDef { id: TabId; label: string; }

function getTabs(role: string): TabDef[] {
  if (role === 'employee') return [
    { id: 'my-schedule',   label: 'My Schedule' },
    { id: 'team-schedule', label: 'Team Schedule' },
    { id: 'my-avail',      label: 'My Availability' },
  ];
  if (role === 'manager') return [
    { id: 'mgr-schedule',   label: 'Schedule' },
    { id: 'team-avail',     label: 'Team Availability' },
    { id: 'shift-template', label: 'Shift Template' },
    { id: 'shift-presets',  label: 'Shift Presets' },
    { id: 'staff',          label: 'Manage Staff' },
  ];
  return [
    { id: 'overview',        label: 'Overview' },
    { id: 'build-schedule',  label: 'Build Schedule' },
    { id: 'all-schedules',   label: 'All Schedules' },
    { id: 'owner-avail',     label: 'Team Availability' },
    { id: 'owner-template',  label: 'Shift Template' },
    { id: 'owner-presets',   label: 'Shift Presets' },
    { id: 'all-staff',       label: 'All Staff' },
  ];
}

export default function AppShell() {
  const { authUser, savedMsg, savedKind } = useStore();
  const tabs = getTabs(authUser!.role);
  const [active, setActive] = useState<TabId>(tabs[0].id);

  return (
    <div className="min-h-screen flex flex-col">
      <Topbar />

      <nav className="bg-white border-b border-black/10 flex px-6 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActive(t.id)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
              active === t.id ? 'border-[#0D6E4F] text-[#0D6E4F]' : 'border-transparent text-gray-400 hover:text-black'
            }`}>
            {t.label}
          </button>
        ))}
      </nav>

      <main className="flex-1 p-3 sm:p-6 max-w-[1200px] mx-auto w-full">
        {savedMsg && <SaveBanner message={savedMsg} kind={savedKind} />}

        {active === 'my-schedule'   && <MySchedule />}
        {active === 'team-schedule' && <TeamSchedule />}
        {active === 'my-avail'      && <MyAvailability />}
        {active === 'mgr-schedule'   && <ManagerSchedule />}
        {active === 'team-avail'     && <TeamAvailability />}
        {active === 'shift-template' && <ShiftTemplate />}
        {active === 'shift-presets'  && <ShiftPresets />}
        {active === 'staff'        && <ManageStaff restaurant={authUser!.restaurant!} />}
        {active === 'overview'        && <OwnerOverview />}
        {active === 'build-schedule'  && <OwnerSchedule />}
        {active === 'all-schedules'   && <AllSchedules />}
        {active === 'owner-avail'     && <TeamAvailability />}
        {active === 'owner-template'  && <ShiftTemplate />}
        {active === 'owner-presets'   && <ShiftPresets />}
        {active === 'all-staff'    && (
          <div className="space-y-10">
            {Object.keys(RESTAURANTS).map((rk) => (
              <ManageStaff key={rk} restaurant={rk} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
