'use client';
import { DAYS, fmtShort, shiftColorClass } from '@/lib/constants';
import { Schedule } from '@/types';

export function WeekNav({ weekOffset, onChange }: { weekOffset: number; onChange: (fn: (o: number) => number) => void }) {
  const label = weekOffset === 0 ? 'This week' : weekOffset > 0 ? `+${weekOffset}w` : `${weekOffset}w`;
  return (
    <div className="flex items-center gap-2">
      <button onClick={() => onChange(o => o - 1)} className="w-8 h-8 flex items-center justify-center bg-gray-50 border border-black/10 rounded-lg hover:bg-white transition-all text-base">‹</button>
      <span className="text-sm font-medium min-w-[90px] text-center">{label}</span>
      <button onClick={() => onChange(o => o + 1)} className="w-8 h-8 flex items-center justify-center bg-gray-50 border border-black/10 rounded-lg hover:bg-white transition-all text-base">›</button>
    </div>
  );
}

export function SectionHeader({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
      <div>
        <h2 className="text-base font-medium">{title}</h2>
        {sub && <p className="text-sm text-[var(--color-muted)]">{sub}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

export function ScheduleGrid({ pins, users, schedule, weekDates }: {
  pins: number[];
  users: Record<number, { name: string }>;
  schedule: Schedule;
  weekDates: Date[];
}) {
  const today = new Date();
  const isToday = (d: Date) => d.toDateString() === today.toDateString();
  return (
    <div className="bg-white border border-black/10 rounded-xl overflow-hidden mb-6">
      <div className="grid bg-gray-50 border-b border-black/10" style={{ gridTemplateColumns: '110px repeat(7, 1fr)' }}>
        <div className="p-2 pl-3 text-xs font-medium text-[var(--color-muted)]">Employee</div>
        {DAYS.map((d, i) => (
          <div key={d} className={`p-2 text-center text-xs font-medium ${isToday(weekDates[i]) ? 'text-blue-600' : 'text-[var(--color-muted)]'}`}>
            <div>{d}</div><div className="text-[10px] mt-0.5">{weekDates[i]?.getDate()}</div>
          </div>
        ))}
      </div>
      {pins.length === 0 && <div className="p-6 text-center text-sm text-[var(--color-muted)]">No employees</div>}
      {pins.map(p => (
        <div key={p} className="grid border-b border-black/[0.06] last:border-b-0" style={{ gridTemplateColumns: '110px repeat(7, 1fr)' }}>
          <div className="p-2 pl-3 text-[12px] font-medium flex items-center border-r border-black/[0.06]">{users[p]?.name.split(' ')[0]}</div>
          {DAYS.map((d, i) => {
            const sh = schedule[p]?.[d];
            return (
              <div key={d} className={`flex items-center justify-center min-h-[44px] border-r border-black/[0.04] last:border-r-0 ${isToday(weekDates[i]) ? 'bg-blue-500/[0.03]' : ''}`}>
                {sh ? (
                  <span className={`text-[10px] font-medium px-2 py-1 rounded-full border ${shiftColorClass(sh.s)}`}>
                    {fmtShort(sh.s)}-{fmtShort(sh.e)}
                  </span>
                ) : (
                  <span className="text-[11px] text-gray-400">Off</span>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
