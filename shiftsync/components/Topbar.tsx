'use client';

import { useStore } from '@/lib/store';
import { RESTAURANTS } from '@/lib/constants';

export default function Topbar() {
  const { authUser, logout } = useStore();
  if (!authUser) return null;
  const rest = authUser.restaurant ? RESTAURANTS[authUser.restaurant] : null;

  return (
    <header className="bg-white border-b border-black/10 h-14 flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <span className="text-[15px] font-semibold tracking-tight">⬡ ShiftSync</span>
        {rest && (
          <span className={`text-xs font-medium px-3 py-1 rounded-full ${rest.badgeClass}`}>{rest.name}</span>
        )}
        <span className="text-xs px-2 py-1 rounded-full border border-black/10 text-gray-400 capitalize">{authUser.role}</span>
        <span className="text-sm font-medium">{authUser.name}</span>
      </div>
      <button onClick={logout}
        className="text-sm text-gray-400 px-3 py-1.5 rounded-lg border border-black/10 hover:bg-gray-50 transition-all">
        Sign out
      </button>
    </header>
  );
}
