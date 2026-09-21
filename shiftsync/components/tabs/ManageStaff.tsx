'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { RESTAURANTS, getPositionsForRestaurant, getPositionLabel } from '@/lib/constants';
import { Role, RestaurantKey, PositionKey } from '@/types';


interface FormState {
  mode: 'add' | 'edit';
  origPin?: number;
  pin: string;
  name: string;
  role: Role;
  restaurant: RestaurantKey;
  position: PositionKey | '';
  username: string;
  password: string;
  wage: string;
  isMinor: boolean;
}

export default function ManageStaff({ restaurant }: { restaurant: string }) {
  const { authUser, users, addUser, editUser, deleteUser, flash } = useStore();
  const rest = RESTAURANTS[restaurant];
  const [form, setForm]       = useState<FormState | null>(null);
  const [formErr, setFormErr] = useState('');

  const staff = Object.entries(users).filter(
    ([, u]) => u.restaurant === restaurant && (u.role === 'employee' || u.role === 'on_call' || u.role === 'manager')
  );
  const canManage = authUser?.role === 'owner' || authUser?.restaurant === restaurant;

  const openAdd = () => {
    const rk = restaurant as RestaurantKey;
    setForm({ mode: 'add', pin: '', name: '', role: 'employee', restaurant: rk, position: getPositionsForRestaurant(rk)[0]?.key ?? '', username: '', password: '', wage: '', isMinor: false });
  };

  const openEdit = (p: number) => setForm({
    mode: 'edit', origPin: p,
    pin: String(p),
    name: users[p].name,
    role: users[p].role as Role,
    restaurant: users[p].restaurant as RestaurantKey,
    position: users[p].position ?? '',
    username: users[p].username ?? '',
    password: users[p].password ?? '',
    wage: users[p].wage != null ? String(users[p].wage) : '',
    isMinor: users[p].isMinor ?? false,
  });

  const closeForm = () => { setForm(null); setFormErr(''); };

  const handleSave = () => {
    if (!form) return;
    const pin  = parseInt(form.pin);
    const wage = form.wage !== '' ? parseFloat(form.wage) : undefined;
    const err  = form.mode === 'add'
      ? addUser(pin, form.name, form.role, form.restaurant, form.username, form.password, form.position || undefined, wage, form.isMinor || undefined)
      : editUser(form.origPin!, pin, form.name, form.role, form.restaurant, form.username, form.password, form.position || undefined, wage, form.isMinor || undefined);
    if (err) { setFormErr(err); return; }
    flash(form.mode === 'add' ? `${form.name} added (PIN ${form.pin})` : 'Staff member updated');
    closeForm();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-3 py-1 rounded-full ${rest.badgeClass}`}>{rest.name}</span>
          <span className="text-sm text-gray-400">{staff.length} staff</span>
        </div>
        {canManage && (
          <button onClick={openAdd} className="text-sm font-medium px-3 py-1.5 border border-black/10 rounded-lg hover:bg-gray-50 transition-all">
            + Add staff
          </button>
        )}
      </div>

      {/* Form */}
      {form && (
        <div className="bg-gray-50 border border-black/10 rounded-xl p-5 mb-4">
          <h3 className="text-sm font-semibold mb-4">{form.mode === 'add' ? 'Add staff member' : 'Edit staff member'}</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Full name</label>
              <input type="text" value={form.name} maxLength={40} placeholder="Jane Smith"
                onChange={(e) => { setForm((f) => f && ({ ...f, name: e.target.value })); setFormErr(''); }}
                className="w-full text-sm px-3 py-2 rounded-lg border border-black/10 bg-white focus:outline-none focus:border-black/40" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">4-digit PIN</label>
              <input type="text" value={form.pin} maxLength={4} placeholder="e.g. 5678"
                onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 4); setForm((f) => f && ({ ...f, pin: v })); setFormErr(''); }}
                className="w-full text-sm px-3 py-2 rounded-lg border border-black/10 bg-white focus:outline-none focus:border-black/40" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Role</label>
              <select value={form.role} onChange={(e) => setForm((f) => f && ({ ...f, role: e.target.value as Role }))}
                className="w-full text-sm px-3 py-2 rounded-lg border border-black/10 bg-white focus:outline-none">
                <option value="employee">Employee</option>
                <option value="on_call">ON CALL</option>
                <option value="manager">Manager</option>
              </select>
            </div>
            {authUser?.role === 'owner' && (
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Restaurant</label>
                <select value={form.restaurant} onChange={(e) => {
                  const next = e.target.value as RestaurantKey;
                  setForm((f) => f && ({ ...f, restaurant: next, position: getPositionsForRestaurant(next)[0]?.key ?? '' }));
                }} className="w-full text-sm px-3 py-2 rounded-lg border border-black/10 bg-white focus:outline-none">
                  {Object.entries(RESTAURANTS).map(([k, r]) => <option key={k} value={k}>{r.name}</option>)}
                </select>
              </div>
            )}
          </div>

          {getPositionsForRestaurant(form.restaurant).length > 0 && (
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-400 mb-1">Default position</label>
              <select value={form.position} onChange={(e) => setForm((f) => f && ({ ...f, position: e.target.value as PositionKey }))}
                className="w-full text-sm px-3 py-2 rounded-lg border border-black/10 bg-white focus:outline-none">
                <option value="">No position</option>
                {getPositionsForRestaurant(form.restaurant).map((pos) => <option key={pos.key} value={pos.key}>{pos.label}</option>)}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Hourly wage ($)</label>
              <input type="number" min="0" step="0.25" value={form.wage} placeholder="e.g. 15.00"
                onChange={(e) => setForm((f) => f && ({ ...f, wage: e.target.value }))}
                className="w-full text-sm px-3 py-2 rounded-lg border border-black/10 bg-white focus:outline-none focus:border-black/40" />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isMinor} onChange={(e) => setForm((f) => f && ({ ...f, isMinor: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300" />
                <span className="text-sm text-gray-700">Minor (under 18)</span>
              </label>
            </div>
          </div>

          {form.role === 'manager' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Username</label>
                <input type="text" value={form.username} maxLength={30} placeholder="alex"
                  onChange={(e) => { setForm((f) => f && ({ ...f, username: e.target.value })); setFormErr(''); }}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-black/10 bg-white focus:outline-none focus:border-black/40" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Password</label>
                <input type="text" value={form.password} maxLength={40} placeholder="Temporary password"
                  onChange={(e) => { setForm((f) => f && ({ ...f, password: e.target.value })); setFormErr(''); }}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-black/10 bg-white focus:outline-none focus:border-black/40" />
              </div>
            </div>
          )}

          {formErr && <p className="text-xs text-red-600 mb-3">{formErr}</p>}
          <div className="flex gap-2">
            <button onClick={handleSave} className="px-4 py-1.5 text-sm font-medium bg-[#0D6E4F] text-white rounded-lg hover:opacity-90 transition-all">Save</button>
            <button onClick={closeForm} className="px-4 py-1.5 text-sm border border-black/10 rounded-lg hover:bg-gray-100 transition-all">Cancel</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-black/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: '500px' }}>
            <thead>
              <tr className="bg-gray-50 border-b border-black/10">
                <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Name</th>
                <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">PIN</th>
                <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Role</th>
                <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Position</th>
                <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Wage</th>
                {authUser?.role === 'owner' && <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Restaurant</th>}
                {canManage && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody>
              {staff.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">No staff yet — click "Add staff" to get started.</td></tr>
              )}
              {staff.map(([p, u]) => (
                <tr key={p} className="border-b border-black/[0.05] last:border-b-0 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-gray-50 border border-black/10 text-gray-400">{p}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-50 border border-black/10 text-gray-400 uppercase">{u.role === 'on_call' ? 'ON CALL' : u.role}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{u.position ? getPositionLabel(u.position) : '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {u.wage != null ? `$${u.wage.toFixed(2)}/h` : <span className="text-gray-300">—</span>}
                    {u.isMinor && <span className="ml-1.5 text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded-full font-medium">Minor</span>}
                  </td>
                  {authUser?.role === 'owner' && (
                    <td className="px-4 py-3 text-xs text-gray-400">{RESTAURANTS[u.restaurant!]?.name}</td>
                  )}
                  {canManage && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(Number(p))} className="text-xs px-2.5 py-1 border border-black/10 rounded-lg hover:bg-gray-100 transition-all">Edit</button>
                        <button onClick={() => { deleteUser(Number(p)); flash(`${u.name} removed`); }}
                          className="text-xs px-2.5 py-1 border border-red-200 text-red-700 rounded-lg hover:bg-red-50 transition-all">Remove</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
