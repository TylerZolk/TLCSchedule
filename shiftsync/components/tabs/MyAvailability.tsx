'use client';

import { useStore } from '@/lib/store';
import { DAYS, HOURS } from '@/lib/constants';
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
          const av = availability[pin]?.[d] ?? { unavailable: true, open: false, start: 9, end: 17 };
          return (
            <div key={d} className="bg-white border border-black/10 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm font-semibold text-gray-700 w-10 shrink-0">{d}</span>

                {/* Status buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => { setAvailDay(pin, d, 'unavailable', true); setAvailDay(pin, d, 'open', false); }}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
                      av.unavailable ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-50 border-black/10 text-gray-400 hover:bg-gray-100'
                    }`}>
                    Unavailable
                  </button>
                  <button
                    onClick={() => { setAvailDay(pin, d, 'unavailable', false); setAvailDay(pin, d, 'open', true); }}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
                      !av.unavailable && av.open ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-black/10 text-gray-400 hover:bg-gray-100'
                    }`}>
                    Open
                  </button>
                  <button
                    onClick={() => { setAvailDay(pin, d, 'unavailable', false); setAvailDay(pin, d, 'open', false); }}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
                      !av.unavailable && !av.open ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-black/10 text-gray-400 hover:bg-gray-100'
                    }`}>
                    Hours
                  </button>
                </div>

                {!av.unavailable && av.open && (
                  <span className="ml-auto text-xs font-medium text-green-600">Any time</span>
                )}
                {!av.unavailable && !av.open && (
                  <span className="ml-auto text-xs font-medium text-gray-500">
                    {av.start % 12 || 12}{av.start < 12 ? 'am' : 'pm'} – {av.end % 12 || 12}{av.end < 12 ? 'am' : 'pm'}
                  </span>
                )}
              </div>

              {!av.unavailable && !av.open && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-1.5">From</p>
                    <select value={av.start}
                      onChange={(e) => setAvailDay(pin, d, 'start', Number(e.target.value))}
                      className="w-full text-sm py-2 px-3 rounded-xl border border-black/10 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0D6E4F]/20">
                      {HOURS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1.5">Until</p>
                    <select value={av.end}
                      onChange={(e) => setAvailDay(pin, d, 'end', Number(e.target.value))}
                      className="w-full text-sm py-2 px-3 rounded-xl border border-black/10 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0D6E4F]/20">
                      {[...HOURS.filter((h) => h.value >= 7), ...HOURS.filter((h) => h.value <= 6)]
                        .map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
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
