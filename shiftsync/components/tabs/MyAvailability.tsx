'use client';

import { useStore } from '@/lib/store';
import { DAYS, HOURS, fmtShort } from '@/lib/constants';
import { SectionHeader } from '@/components/SectionHeader';

export default function MyAvailability() {
  const { authUser, availability, setAvailDay, flash } = useStore();
  const pin = authUser!.pin;

  return (
    <>
      <SectionHeader title="My Availability" sub="Set your available hours — your manager sees this when building the schedule">
        <button onClick={() => flash('Availability saved!')}
          className="px-4 py-2 text-sm font-medium bg-[#0D6E4F] text-white rounded-lg hover:opacity-90 transition-all">
          Save
        </button>
      </SectionHeader>

      <div className="space-y-2">
        {DAYS.map((d) => {
          const av = availability[pin]?.[d] ?? { unavailable: false, start: 9, end: 17 };
          return (
            <div key={d} className="bg-white border border-black/10 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm font-semibold text-gray-700 w-10 shrink-0">{d}</span>
                <button
                  onClick={() => setAvailDay(pin, d, 'unavailable', !av.unavailable)}
                  className={`text-xs font-medium px-4 py-1.5 rounded-lg border transition-all ${
                    av.unavailable
                      ? 'bg-red-50 border-red-200 text-red-700'
                      : 'bg-green-50 border-green-200 text-green-700'
                  }`}>
                  {av.unavailable ? 'Unavailable' : 'Available'}
                </button>
                {!av.unavailable && (
                  <span className="ml-auto text-xs font-medium text-gray-500">
                    {fmtShort(av.start)}–{fmtShort(av.end)} · {av.end > av.start ? av.end - av.start : 24 - av.start + av.end}h
                  </span>
                )}
              </div>

              {!av.unavailable && (
                <div className="grid grid-cols-2 gap-3 pl-13">
                  <div>
                    <p className="text-xs text-gray-400 mb-1.5">From</p>
                    <select
                      value={av.start}
                      onChange={(e) => setAvailDay(pin, d, 'start', parseInt(e.target.value))}
                      className="w-full text-sm py-2 px-3 rounded-xl border border-black/10 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0D6E4F]/20">
                      {HOURS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1.5">Until</p>
                    <select
                      value={av.end}
                      onChange={(e) => setAvailDay(pin, d, 'end', parseInt(e.target.value))}
                      className="w-full text-sm py-2 px-3 rounded-xl border border-black/10 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0D6E4F]/20">
                      {HOURS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
