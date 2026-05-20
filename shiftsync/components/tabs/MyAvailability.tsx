'use client';

import { useStore } from '@/lib/store';
import { DAYS, HOURS, fmtShort } from '@/lib/constants';
import { SectionHeader } from '@/components/SectionHeader';

export default function MyAvailability() {
  const { authUser, availability, setAvailDay, flash } = useStore();
  const pin = authUser!.pin;

  return (
    <>
      <SectionHeader title="My availability" sub="Set your available hours — your manager sees this when building the schedule">
        <button onClick={() => flash('Availability saved!')}
          className="px-4 py-2 text-sm font-medium bg-[#0D6E4F] text-white rounded-lg hover:opacity-90 transition-all">
          Save
        </button>
      </SectionHeader>

      <div className="grid grid-cols-7 gap-3">
        {DAYS.map((d) => {
          const av = availability[pin]?.[d] ?? { unavailable: false, start: 9, end: 17 };
          return (
            <div key={d} className="bg-white border border-black/10 rounded-xl p-3 flex flex-col gap-2">
              <p className="text-xs font-semibold text-center text-gray-500">{d}</p>

              <button
                onClick={() => setAvailDay(pin, d, 'unavailable', !av.unavailable)}
                className={`w-full text-xs font-medium py-1.5 rounded-lg border transition-all ${
                  av.unavailable
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-green-50 border-green-200 text-green-700'
                }`}>
                {av.unavailable ? 'Unavailable' : 'Available'}
              </button>

              {!av.unavailable && (
                <>
                  <div>
                    <p className="text-[9px] text-gray-400 mb-1">From</p>
                    <select value={av.start} onChange={(e) => setAvailDay(pin, d, 'start', parseInt(e.target.value))}
                      className="w-full text-[11px] p-1.5 rounded-lg border border-black/10 bg-gray-50 focus:outline-none">
                      {HOURS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400 mb-1">Until</p>
                    <select value={av.end} onChange={(e) => setAvailDay(pin, d, 'end', parseInt(e.target.value))}
                      className="w-full text-[11px] p-1.5 rounded-lg border border-black/10 bg-gray-50 focus:outline-none">
                      {HOURS.filter((h) => h.value > av.start).map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
                    </select>
                  </div>
                  <div className="text-[10px] font-semibold text-center py-1 rounded-lg bg-green-50 text-green-700">
                    {fmtShort(av.start)}–{fmtShort(av.end)} · {av.end - av.start}h
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
