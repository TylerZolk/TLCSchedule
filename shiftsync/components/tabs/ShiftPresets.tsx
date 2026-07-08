'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { HOURS, RESTAURANTS, getPositionsForRestaurant, fmtRange } from '@/lib/constants';
import { SectionHeader } from '@/components/SectionHeader';
import { RestaurantKey, PositionKey } from '@/types';

export default function ShiftPresets() {
  const { authUser, shiftPresets, addShiftPreset, removeShiftPreset } = useStore();
  const isOwner = authUser!.role === 'owner';
  const [ownerRestaurant, setOwnerRestaurant] = useState<RestaurantKey>('tlc');
  const restaurant = isOwner ? ownerRestaurant : authUser!.restaurant! as RestaurantKey;
  const positions  = getPositionsForRestaurant(restaurant);
  const presets    = shiftPresets[restaurant] ?? [];

  const [name,     setName]     = useState('');
  const [start,    setStart]    = useState(18);
  const [end,      setEnd]      = useState(2);
  const [position, setPosition] = useState<PositionKey | ''>('');
  const [error,    setError]    = useState('');

  const endHours = [...HOURS.filter((h) => h.value >= 7), ...HOURS.filter((h) => h.value <= 6)];

  function handleAdd() {
    if (!name.trim()) { setError('Name is required'); return; }
    addShiftPreset(restaurant, name.trim(), start, end, position || undefined);
    setName(''); setStart(18); setEnd(2); setPosition(''); setError('');
  }

  return (
    <>
      <SectionHeader
        title={`${RESTAURANTS[restaurant].name} — Shift Presets`}
        sub="Define common shift times for quick selection when building the schedule"
      />

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

      {/* Add form */}
      <div className="bg-white border border-black/10 rounded-xl p-5 mb-5">
        <p className="text-sm font-semibold mb-4">Add preset</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Preset name</label>
            <input
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              placeholder="e.g. Opening, Closing, Mid"
              className="w-full text-sm px-3 py-2 rounded-lg border border-black/10 bg-white focus:outline-none focus:border-black/40"
            />
          </div>
          {positions.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Position (optional)</label>
              <select value={position} onChange={(e) => setPosition(e.target.value as PositionKey | '')}
                className="w-full text-sm px-3 py-2 rounded-lg border border-black/10 bg-white focus:outline-none">
                <option value="">Any position</option>
                {positions.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
              </select>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Start time</label>
            <select value={start} onChange={(e) => setStart(Number(e.target.value))}
              className="w-full text-sm px-3 py-2 rounded-lg border border-black/10 bg-white focus:outline-none">
              {HOURS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">End time</label>
            <select value={end} onChange={(e) => setEnd(Number(e.target.value))}
              className="w-full text-sm px-3 py-2 rounded-lg border border-black/10 bg-white focus:outline-none">
              {endHours.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
            </select>
          </div>
        </div>
        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
        <button onClick={handleAdd}
          className="px-4 py-2 text-sm font-medium bg-[#0D6E4F] text-white rounded-lg hover:opacity-90 transition-all">
          Add preset
        </button>
      </div>

      {/* Preset list */}
      {presets.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No presets yet — add one above</p>
      ) : (
        <div className="bg-white border border-black/10 rounded-xl overflow-hidden">
          <div className="divide-y divide-black/5">
            {presets.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3 gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-800">{p.name}</span>
                  <span className="text-xs text-gray-400">{fmtRange(p.start, p.end)}</span>
                  {p.position && (
                    <span className="text-xs text-gray-400 capitalize">{p.position}</span>
                  )}
                </div>
                <button onClick={() => removeShiftPreset(restaurant, p.id)}
                  className="text-xs px-2.5 py-1 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-all">
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
