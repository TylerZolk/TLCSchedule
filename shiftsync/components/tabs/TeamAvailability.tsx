'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { DAYS, RESTAURANTS, fmtShort, initials } from '@/lib/constants';
import { SectionHeader } from '@/components/SectionHeader';
import { RestaurantKey } from '@/types';

export default function TeamAvailability() {
  const { authUser, users, availability, getEmployees } = useStore();
  const isOwner = authUser!.role === 'owner';
  const [ownerRestaurant, setOwnerRestaurant] = useState<RestaurantKey>('tlc');
  const restaurant = isOwner ? ownerRestaurant : authUser!.restaurant! as RestaurantKey;
  const empPins = getEmployees(restaurant).map(([p]) => Number(p));
  const col = '190px repeat(7, 1fr)';

  return (
    <>
      <SectionHeader title="Team availability" sub="Hours each employee submitted as available — use this when building the schedule" />

      {isOwner && (
        <div className="flex gap-2 mb-5">
          {Object.entries(RESTAURANTS).map(([rk, r]) => (
            <button key={rk} onClick={() => setOwnerRestaurant(rk as RestaurantKey)}
              className={`text-sm px-4 py-1.5 rounded-full font-medium transition-all ${
                ownerRestaurant === rk ? r.badgeClass : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}>
              {r.name}
            </button>
          ))}
        </div>
      )}

      <div className="bg-white border border-black/10 rounded-xl overflow-hidden mb-6">
        <div className="overflow-x-auto">
        <div style={{ minWidth: '620px' }}>
        {/* Header */}
        <div className="grid border-b border-black/10 bg-gray-50" style={{ gridTemplateColumns: col }}>
          <div className="px-4 py-3 text-xs font-medium text-gray-400 border-r border-black/10">Employee</div>
          {DAYS.map((d) => (
            <div key={d} className="py-3 text-center text-xs font-medium text-gray-400 border-r border-black/[0.06]">{d}</div>
          ))}
        </div>

        {empPins.length === 0 && (
          <div className="py-12 text-center text-sm text-gray-400">No employees yet</div>
        )}

        {empPins.map((p) => (
          <div key={p} className="grid border-b border-black/[0.06] last:border-b-0 hover:bg-gray-50/50 transition-colors"
            style={{ gridTemplateColumns: col }}>
            <div className="px-4 py-3 flex items-center gap-3 border-r border-black/[0.06]">
              <div className="w-8 h-8 rounded-full bg-[#E6F1FB] text-[#0C447C] flex items-center justify-center text-xs font-semibold flex-shrink-0">
                {initials(users[p]?.name ?? '')}
              </div>
              <span className="text-sm font-medium">{users[p]?.name}</span>
            </div>
            {DAYS.map((d) => {
              const av = availability[p]?.[d] ?? { unavailable: true, open: false, start: 9, end: 17 };
              return (
                <div key={d} className="flex items-center justify-center p-2 border-r border-black/[0.04] last:border-r-0 min-h-[60px]">
                  {av.unavailable ? (
                    <div className="text-[10px] font-medium px-2 py-1.5 rounded-lg text-center leading-tight"
                      style={{ background: '#FFEBEE', border: '1px solid #EF9A9A', color: '#B71C1C' }}>
                      Off
                    </div>
                  ) : av.open ? (
                    <div className="text-[10px] font-medium px-2 py-1.5 rounded-lg text-center leading-tight"
                      style={{ background: '#E8F5E9', border: '1px solid #81C784', color: '#1B5E20' }}>
                      Open
                    </div>
                  ) : (
                    <div className="text-[10px] font-medium px-2 py-1.5 rounded-lg text-center leading-snug"
                      style={{ background: '#E8F5E9', border: '1px solid #81C784', color: '#1B5E20' }}>
                      {fmtShort(av.start)}–{fmtShort(av.end)}<br />
                      <span className="opacity-60">{av.end > av.start ? av.end - av.start : 24 - av.start + av.end}h</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
        </div>{/* end min-width */}
        </div>{/* end overflow-x-auto */}
      </div>
    </>
  );
}
