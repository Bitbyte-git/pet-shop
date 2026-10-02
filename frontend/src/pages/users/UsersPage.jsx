import { useState, useEffect } from 'react';
import { userAPI } from '../../services/api';
import Modal from '../../components/common/Modal';
import { formatDateTime, errorMessage } from '../../utils/helpers';
import { PlusIcon, PencilIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ROLES = ['BILLING_MANAGER', 'ADMIN', 'SUPER_ADMIN'];
const EMPTY = { name: '', email: '', phone: '', password: '', role: 'BILLING_MANAGER' };

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    userAPI.getAll().then((r) => setUsers(r.data.users || [])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === 'create') { await userAPI.create(form); toast.success('Billing Manager account created successfully.'); }
      else { await userAPI.update(modal._id, { name: form.name, phone: form.phone, role: form.role }); toast.success('User updated.'); }
      setModal(null);
      load();
    } catch (err) { toast.error(errorMessage(err)); }
    finally { setSaving(false); }
  };

  const toggleStatus = async (user) => {
    try {
      await userAPI.toggleStatus(user._id);
      toast.success(`Account ${user.status === 'ACTIVE' ? 'deactivated' : 'activated'}.`);
      load();
    } catch (err) { toast.error(errorMessage(err)); }
  };

  return (
    <div className="space-y-5">
      <div className="page-header flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="page-title">Billing Managers & User Management</h1>
          <p className="page-subtitle">Admin control panel: Create and manage operational Billing Managers (BM-1, BM-2, etc.)</p>
        </div>
        <button onClick={() => { setForm(EMPTY); setModal('create'); }} className="btn-primary">
          <PlusIcon className="h-4 w-4" /> Add Billing Manager
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-primary-700 font-bold text-sm">{u.name?.[0]?.toUpperCase()}</span>
                      </div>
                      <span className="font-medium">{u.name}</span>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td>{u.phone || '—'}</td>
                  <td>
                    <span className={`badge ${u.role === 'ADMIN' ? 'badge-blue' : 'badge-orange'}`}>{u.role}</span>
                  </td>
                  <td><span className={`badge ${u.status === 'ACTIVE' ? 'badge-green' : 'badge-red'}`}>{u.status}</span></td>
                  <td className="text-xs text-slate-500">{formatDateTime(u.createdAt)}</td>
                  <td>
                    <div className="flex gap-2">
                      <button onClick={() => { setForm({ name: u.name, email: u.email, phone: u.phone || '', role: u.role, password: '' }); setModal(u); }} className="btn btn-secondary btn-sm">
                        <PencilIcon className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => toggleStatus(u)} className={`btn btn-sm ${u.status === 'ACTIVE' ? 'btn-danger' : 'btn-success'}`}>
                        {u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={!!modal} onClose={() => setModal(null)} title={modal === 'create' ? 'Add New User' : 'Edit User'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-grid">
            <div>
              <label className="label">Full Name *</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="label">Email *</label>
              <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required disabled={modal !== 'create'} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="label">Role *</label>
              <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            {modal === 'create' && (
              <div className="md:col-span-2">
                <label className="label">Password *</label>
                <input className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setModal(null)} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save User'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
