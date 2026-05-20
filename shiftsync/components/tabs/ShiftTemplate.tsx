'use client';

import { useStore } from '@/lib/store';
import { DAYS, HOURS, RESTAURANTS, getPositionsForRestaurant } from '@/lib/constants';
import { SectionHeader } from '@/components/SectionHeader';
import { RestaurantKey, PositionKey } from '@/types';

export default function ShiftTemplate() {
  const { authUser, shiftRequirements, addShiftSlot, updateShiftSlot, removeShiftSlot } = useStore();
  const restaurant = authUser!.restaurant! as RestaurantKey;
  const positions = getPositionsForRestaurant(restaurant);
  const reqs = shiftRequirements[restaurant];

  if (positions.length === 0) {
    return (
      <>
        <SectionHeader title="Shift Template" sub="No positions configured for this restaurant." />
      </>
    );
  }

  return (
    <>
      <SectionHeader
        title={`${RESTAURANTS[restaurant].name} — Shift Template`}
        sub="Define required staffing per shift. The auto-scheduler uses this to fill the schedule."
      />

      <div className="space-y-4">
        {DAYS.map((day) => (
          <div key={day} className="bg-white rounded-xl border border-black/8 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-black/6 bg-gray-50">
              <span className="text-sm font-semibold text-gray-700">{day}</span>
            </div>

            <div className="divide-y divide-black/5">
              {positions.map(({ key: posKey, label: posLabel, className: posClass }) => {
                const slots = reqs[day]?.[posKey] ?? [];
                return (
                  <div key={posKey} className="flex items-start gap-4 px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 mt-0.5 ${posClass}`}>
                      {posLabel}
                    </span>

                    <div className="flex flex-wrap gap-2 flex-1">
                      {slots.map((slot) => (
                        <div
                          key={slot.id}
                          className="flex items-center gap-1.5 bg-gray-50 border border-black/8 rounded-lg px-2.5 py-1.5 text-xs"
                        >
                          <select
                            value={slot.start}
                            onChange={(e) => updateShiftSlot(restaurant, day, posKey as PositionKey, slot.id, 'start', Number(e.target.value))}
                            className="bg-transparent border-none outline-none text-xs cursor-pointer"
                          >
                            {HOURS.map((h) => (
                              <option key={h.value} value={h.value}>{h.label}</option>
                            ))}
                          </select>

                          <span className="text-gray-400">–</span>

                          <select
                            value={slot.end}
                            onChange={(e) => updateShiftSlot(restaurant, day, posKey as PositionKey, slot.id, 'end', Number(e.target.value))}
                            className="bg-transparent border-none outline-none text-xs cursor-pointer"
                          >
                            {HOURS.map((h) => (
                              <option key={h.value} value={h.value}>{h.label}</option>
                            ))}
                          </select>

                          <span className="text-gray-300 mx-0.5">|</span>

                          <button
                            onClick={() => updateShiftSlot(restaurant, day, posKey as PositionKey, slot.id, 'count', Math.max(1, slot.count - 1))}
                            className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 transition-all font-medium text-gray-500"
                          >
                            −
                          </button>
                          <span className="w-4 text-center font-semibold">{slot.count}</span>
                          <button
                            onClick={() => updateShiftSlot(restaurant, day, posKey as PositionKey, slot.id, 'count', slot.count + 1)}
                            className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 transition-all font-medium text-gray-500"
                          >
                            +
                          </button>

                          <span className="text-gray-300 mx-0.5">|</span>

                          <button
                            onClick={() => removeShiftSlot(restaurant, day, posKey as PositionKey, slot.id)}
                            className="text-gray-300 hover:text-red-400 transition-all font-medium"
                          >
                            ✕
                          </button>
                        </div>
                      ))}

                      <button
                        onClick={() => addShiftSlot(restaurant, day, posKey as PositionKey)}
                        className="text-xs px-2.5 py-1.5 border border-dashed border-black/20 rounded-lg text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-all"
                      >
                        + Add Shift
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
