'use client';

import { useStore } from '@/lib/store';
import { RESTAURANTS, DAYS } from '@/lib/constants';
import { SectionHeader } from '@/components/SectionHeader';

export default function OwnerOverview() {
  const { schedule, getEmployees, getManagers, empWeekHours } = useStore();

  return (
    <>
      <SectionHeader title="Owner overview" sub="All restaurants at a glance" />
      <div className="space-y-4">
        {Object.entries(RESTAURANTS).map(([rk, r]) => {
          const emps       = getEmployees(rk);
          const mgrs       = getManagers(rk);
          const working    = emps.filter(([p]) => DAYS.some((d) => (schedule[Number(p)]?.[d] ?? []).length > 0)).length;
          const totalHours = emps.reduce((acc, [p]) => acc + empWeekHours(Number(p)), 0);

          return (
            <div key={rk} className="bg-white border border-black/10 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-black/10">
                <span className={`text-sm font-medium px-3 py-1 rounded-full ${r.badgeClass}`}>{r.name}</span>
                <span className="text-xs text-gray-400">{mgrs.length} manager · {emps.length} staff</span>
              </div>
              <div className="grid grid-cols-3 divide-x divide-black/[0.06]">
                {[
                  { label: 'Total staff',       value: emps.length },
                  { label: 'Working this week', value: working },
                  { label: 'Total hours',       value: `${totalHours}h` },
                ].map(({ label, value }) => (
                  <div key={label} className="px-5 py-4">
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">{label}</p>
                    <p className="text-xl font-semibold">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
