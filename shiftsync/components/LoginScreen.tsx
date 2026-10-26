'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';

export default function LoginScreen() {
  const { login, loginWithCredentials } = useStore();
  const [mode, setMode] = useState<'employee' | 'manager'>('employee');
  const [pin, setPin] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleDigit = async (digit: string) => {
    if (busy || pin.length >= 4) return;
    const next = pin + digit;
    setPin(next);
    setError('');
    if (next.length === 4) {
      setBusy(true);
      const err = await login(parseInt(next));
      setBusy(false);
      if (err) {
        setError(err);
        setPin('');
      }
    }
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const err = await loginWithCredentials(username, password);
    setBusy(false);
    if (err) setError(err);
  };

  const switchMode = (nextMode: 'employee' | 'manager') => {
    setMode(nextMode);
    setPin('');
    setUsername('');
    setPassword('');
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-[#f5f4f0]">
      <div className="bg-white border border-black/10 rounded-2xl p-6 sm:p-10 w-full max-w-sm shadow-sm">
        <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-6">ShiftSync</p>
        <h1 className="text-2xl font-medium mb-1">Good to see you</h1>
        <p className="text-sm text-gray-400 mb-6">
          {mode === 'employee' ? 'Enter your 4-digit clock-in number' : 'Sign in with your manager credentials'}
        </p>

        <div className="grid grid-cols-2 gap-2 mb-6">
          <button
            onClick={() => switchMode('employee')}
            className={`text-sm font-medium py-2 rounded-lg border transition-all ${
              mode === 'employee'
                ? 'bg-[#0D6E4F] border-[#0D6E4F] text-white'
                : 'bg-gray-50 border-black/10 text-gray-500 hover:bg-white'
            }`}
          >
            Employee
          </button>
          <button
            onClick={() => switchMode('manager')}
            className={`text-sm font-medium py-2 rounded-lg border transition-all ${
              mode === 'manager'
                ? 'bg-[#0D6E4F] border-[#0D6E4F] text-white'
                : 'bg-gray-50 border-black/10 text-gray-500 hover:bg-white'
            }`}
          >
            Manager
          </button>
        </div>

        {mode === 'employee' ? (
          <>
            <div className="flex justify-center gap-3 mb-6">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-medium border transition-all ${
                    pin.length > i ? 'border-black/40 bg-white' : 'border-black/10 bg-gray-50'
                  }`}
                >
                  {pin.length > i ? '*' : ''}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2 mb-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <button
                  key={n}
                  onClick={() => handleDigit(String(n))}
                  className="bg-gray-50 border border-black/10 rounded-xl py-4 text-lg font-medium hover:bg-white active:scale-95 transition-all"
                >
                  {n}
                </button>
              ))}
              <div className="bg-gray-50 border border-black/10 rounded-xl py-4 opacity-20" />
              <button
                onClick={() => handleDigit('0')}
                className="bg-gray-50 border border-black/10 rounded-xl py-4 text-lg font-medium hover:bg-white active:scale-95 transition-all"
              >
                0
              </button>
              <button
                onClick={() => {
                  setPin((p) => p.slice(0, -1));
                  setError('');
                }}
                className="bg-gray-50 border border-black/10 rounded-xl py-4 text-sm text-gray-400 hover:bg-white active:scale-95 transition-all"
              >
                Delete
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleStaffLogin} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Username</label>
              <input
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError('');
                }}
                className="w-full text-sm px-3 py-2 rounded-lg border border-black/10 bg-gray-50 focus:outline-none focus:border-black/40"
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className="w-full text-sm px-3 py-2 rounded-lg border border-black/10 bg-gray-50 focus:outline-none focus:border-black/40"
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full disabled:opacity-60 py-2.5 text-sm font-medium bg-[#0D6E4F] text-white rounded-lg hover:opacity-90 transition-all"
            >
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-red-500 min-h-[20px] mt-2">{error}</p>
      </div>
    </div>
  );
}
