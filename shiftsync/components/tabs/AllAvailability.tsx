'use client';

import { useStore } from '@/lib/store';
import { DAYS, RESTAURANTS, fmtShort, initials } from '@/lib/constants';
import { SectionHeader } from '@/components/SectionHeader';

export default function AllAvailability() {
  const { users, availability, getEmployees } = useStore();

  return (
    <>
      <SectionHeader title="All availability" sub="Hours submitted by all staff" />
      <div className="space-y-8">
        {Object.entries(RESTAURANTS).map(([rk, r]) => {
          const empPins = getEmployees(rk).map(([p]) => Number(p));
          return (
            <div key={rk}>
              <div className="mb-3">
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${r.badgeClass}`}>{r.name}</span>
              </div>
              <div className="bg-white border border-black/10 rounded-xl overflow-hidden">
                {empPins.length === 0 && (
                  <div className="py-10 text-center text-sm text-gray-400">No employees yet</div>
                )}
                {empPins.map((p) => (
                  <div key={p} className="border-b border-black/[0.06] last:border-b-0 p-4">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#E6F1FB] text-[#0C447C] flex items-center justify-center text-xs font-semibold">
                          {initials(users[p]?.name ?? '')}
                        </div>
                        <span className="text-sm font-medium">{users[p]?.name}</span>
                      </div>
                      <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-gray-50 border border-black/10 text-gray-400">{p}</span>
                    </div>
                    <div className="grid grid-cols-7 gap-1.5">
                      {DAYS.map((d) => {
                        const av = availability[p]?.[d] ?? { unavailable: false, start: 9, end: 17 };
                        return (
                          <div key={d} className={`rounded-lg p-2 text-center ${av.unavailable ? 'bg-red-50' : 'bg-green-50'}`}>
                            <div className="text-[10px] font-medium text-gray-400 mb-1">{d}</div>
                            <div className={`text-[10px] font-medium ${av.unavailable ? 'text-red-700' : 'text-green-700'}`}>
                              {av.unavailable ? 'Off' : `${fmtShort(av.start)}-${fmtShort(av.end)}`}
                            </div>
                          </div>
                        );
                      })}
                    </div>
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
