'use client';

import React from 'react';

export function SectionHeader({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-5 gap-3 flex-wrap">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      {children && <div className="flex items-center flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function WeekNav({
  weekOffset,
  onChange,
}: {
  weekOffset: number;
  onChange: React.Dispatch<React.SetStateAction<number>>;
}) {
  const label = weekOffset === 0 ? 'This week' : weekOffset > 0 ? `+${weekOffset}w` : `${weekOffset}w`;
  return (
    <div className="flex items-center gap-1.5">
      <button onClick={() => onChange((o) => o - 1)}
        className="w-8 h-8 flex items-center justify-center bg-gray-50 border border-black/10 rounded-lg hover:bg-white transition-all text-base">
        ‹
      </button>
      <span className="text-sm font-medium min-w-[88px] text-center">{label}</span>
      <button onClick={() => onChange((o) => o + 1)}
        className="w-8 h-8 flex items-center justify-center bg-gray-50 border border-black/10 rounded-lg hover:bg-white transition-all text-base">
        ›
      </button>
    </div>
  );
}
