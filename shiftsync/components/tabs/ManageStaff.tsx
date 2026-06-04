'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { RESTAURANTS } from '@/lib/constants';
import { Role, RestaurantKey } from '@/types';

interface FormState { mode:'add'|'edit'; origPin?:number; pin:string; name:string; role:Role; restaurant:RestaurantKey; }

export default function ManageStaff({ restaurant }: { restaurant: string }) {
  const { authUser, users, addUser, editUser, deleteUser, flash } = useStore();
  const rest = RESTAURANTS[restaurant];
  const [form, setForm] = useState<FormState | null>(null);
  const [formError, setFormError] = useState('');

  const staff = Object.entries(users).filter(([, u]) => u.restaurant === restaurant && (u.role === 'employee' || u.role === 'manager'));
  const openAdd = () => setForm({ mode:'add', pin:'', name:'', role:'employee', restaurant: restaurant as RestaurantKey });
  const openEdit = (p: number) => setForm({ mode:'edit', origPin:p, pin:String(p), name:users[p].name, role:users[p].role as Role, restaurant:users[p].restaurant as RestaurantKey });
  const closeForm = () => { setForm(null); setFormError(''); };

  const handleSave = () => {
    if (!form) return;
    const pin = parseInt(form.pin);
    const err = form.mode === 'add' ? addUser(pin, form.name, form.role, form.restaurant) : editUser(form.origPin!, pin, form.name, form.role, form.restaurant);
    if (err) { setFormError(err); return; }
    flash(form.mode === 'add' ? `${form.name} added with PIN ${form.pin}` : 'Staff member updated');
    closeForm();
  };

  const canManage = authUser?.role === 'owner' || authUser?.restaurant === restaurant;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-3 py-1 rounded-full ${rest.badgeClass}`}>{rest.name}</span>
          <span className="text-sm text-[var(--color-muted)]">{staff.length} staff</span>
        </div>
        {canManage && <button onClick={openAdd} className="text-sm font-medium px-3 py-1.5 border border-black/10 rounded-lg hover:bg-gray-50 transition-all">+ Add staff</button>}
      </div>

      {form && (
        <div className="bg-gray-50 border border-black/10 rounded-xl p-5 mb-4">
          <h3 className="text-sm font-medium mb-4">{form.mode === 'add' ? 'Add staff member' : 'Edit staff member'}</h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-[var(--color-muted)] mb-1">Full name</label>
              <input type="text" value={form.name} onChange={e => { setForm(f => f && ({...f, name:e.target.value})); setFormError(''); }} placeholder="Jane Smith" maxLength={40}
                className="w-full text-sm px-3 py-2 rounded-lg border border-black/10 bg-white focus:outline-none focus:border-black/40" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-muted)] mb-1">4-digit PIN</label>
              <input type="text" value={form.pin} onChange={e => { const v=e.target.value.replace(/\D/g,'').slice(0,4); setForm(f=>f&&({...f,pin:v})); setFormError(''); }} placeholder="e.g. 1234" maxLength={4}
                className="w-full text-sm px-3 py-2 rounded-lg border border-black/10 bg-white focus:outline-none focus:border-black/40" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-[var(--color-muted)] mb-1">Role</label>
              <select value={form.role} onChange={e => setForm(f => f && ({...f, role:e.target.value as Role}))}
                className="w-full text-sm px-3 py-2 rounded-lg border border-black/10 bg-white focus:outline-none">
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
              </select>
            </div>np
            {authUser?.role === 'owner' && (
              <div>
                <label className="block text-xs font-medium text-[var(--color-muted)] mb-1">Restaurant</label>
                <select value={form.restaurant} onChange={e => setForm(f => f && ({...f, restaurant:e.target.value as RestaurantKey}))}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-black/10 bg-white focus:outline-none">
                  {Object.entries(RESTAURANTS).map(([k, r]) => <option key={k} value={k}>{r.name}</option>)}
                </select>
              </div>
            )}
          </div>
          {formError && <p className="text-xs text-red-600 mb-3">{formError}</p>}
          <div className="flex gap-2">
            <button onClick={handleSave} className="px-4 py-1.5 text-sm font-medium bg-black text-white rounded-lg hover:opacity-80 transition-all">Save</button>
            <button onClick={closeForm} className="px-4 py-1.5 text-sm border border-black/10 rounded-lg hover:bg-gray-100 transition-all">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white border border-black/10 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-black/10">
              <th className="text-left text-xs font-medium text-[var(--color-muted)] px-4 py-2.5">Name</th>
              <th className="text-left text-xs font-medium text-[var(--color-muted)] px-4 py-2.5">PIN</th>
              <th className="text-left text-xs font-medium text-[var(--color-muted)] px-4 py-2.5">Role</th>
              {authUser?.role === 'owner' && <th className="text-left text-xs font-medium text-[var(--color-muted)] px-4 py-2.5">Restaurant</th>}
              {canManage && <th className="px-4 py-2.5" />}
            </tr>
          </thead>
          <tbody>
            {staff.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-[var(--color-muted)]">No staff yet.</td></tr>}
            {staff.map(([p, u]) => (
              <tr key={p} className="border-b border-black/[0.05] last:border-b-0 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3"><span className="font-mono text-xs px-2 py-0.5 rounded bg-gray-50 border border-black/10 text-[var(--color-muted)]">{p}</span></td>
                <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-gray-50 border border-black/10 text-[var(--color-muted)]">{u.role}</span></td>
                {authUser?.role === 'owner' && <td className="px-4 py-3 text-xs text-[var(--color-muted)]">{RESTAURANTS[u.restaurant!]?.name}</td>}
                {canManage && (
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(Number(p))} className="text-xs px-2 py-1 border border-black/10 rounded-lg hover:bg-gray-100 transition-all">Edit</button>
                      <button onClick={() => { deleteUser(Number(p)); flash(`${u.name} removed`); }} className="text-xs px-2 py-1 border border-red-200 text-red-700 rounded-lg hover:bg-red-50 transition-all">Remove</button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
