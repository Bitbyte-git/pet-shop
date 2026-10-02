import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { clientAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import SearchInput from '../../components/common/SearchInput';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import { formatDateTime, errorMessage } from '../../utils/helpers';
import { UsersIcon, PlusIcon, PencilIcon, EyeIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const EMPTY_FORM = { name: '', mobile: '', email: '', address: '', city: '', pincode: '', emergencyContact: '', emergencyContactName: '', notes: '' };

function ClientForm({ initial, onSubmit, loading }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div className="form-grid">
        <div>
          <label className="label">Full Name *</label>
          <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} required placeholder="Ravi Kumar" />
        </div>
        <div>
          <label className="label">Mobile Number *</label>
          <input className="input" value={form.mobile} onChange={(e) => set('mobile', e.target.value)} required placeholder="9876543210" />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="ravi@example.com" />
        </div>
        <div>
          <label className="label">City</label>
          <input className="input" value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Chennai" />
        </div>
        <div className="md:col-span-2">
          <label className="label">Address</label>
          <input className="input" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Street, Area" />
        </div>
        <div>
          <label className="label">Emergency Contact Name</label>
          <input className="input" value={form.emergencyContactName} onChange={(e) => set('emergencyContactName', e.target.value)} />
        </div>
        <div>
          <label className="label">Emergency Contact Phone</label>
          <input className="input" value={form.emergencyContact} onChange={(e) => set('emergencyContact', e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <label className="label">Notes</label>
          <textarea className="input resize-none" rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving...' : (initial?._id ? 'Update Client' : 'Create Client')}
        </button>
      </div>
    </form>
  );
}

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // null | 'create' | clientObj
  const [saving, setSaving] = useState(false);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await clientAPI.getAll({ search, page, limit: 15 });
      setClients(res.data.clients);
      setTotal(res.data.total);
    } catch { toast.error('Failed to load clients.'); }
    finally { setLoading(false); }
  }, [search, page]);

  useEffect(() => { fetchClients(); }, [fetchClients]);
  useEffect(() => { setPage(1); }, [search]);

  const handleCreate = async (form) => {
    setSaving(true);
    try {
      await clientAPI.create(form);
      toast.success('Client created successfully.');
      setModal(null);
      fetchClients();
    } catch (err) { toast.error(errorMessage(err)); }
    finally { setSaving(false); }
  };

  const handleUpdate = async (form) => {
    setSaving(true);
    try {
      await clientAPI.update(modal._id, form);
      toast.success('Client updated.');
      setModal(null);
      fetchClients();
    } catch (err) { toast.error(errorMessage(err)); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Patients / Clients</h1>
          <p className="page-subtitle">{total} clients registered</p>
        </div>
        <button onClick={() => setModal('create')} className="btn-primary">
          <PlusIcon className="h-4 w-4" /> Add Client
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name, mobile, or ID..." className="max-w-sm" />
        </div>

        {loading ? <LoadingSpinner /> : (
          <>
            {clients.length === 0 ? (
              <EmptyState icon={UsersIcon} title="No clients found" description="Add your first client to get started."
                action={<button onClick={() => setModal('create')} className="btn-primary">Add Client</button>} />
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead><tr>
                    <th>Client ID</th><th>Name</th><th>Mobile</th><th>City</th>
                    <th>Pets</th><th>Joined</th><th>Status</th><th>Actions</th>
                  </tr></thead>
                  <tbody>
                    {clients.map((c) => (
                      <tr key={c._id}>
                        <td><span className="badge badge-blue font-mono">{c.clientId}</span></td>
                        <td className="font-medium text-slate-800">{c.name}</td>
                        <td>{c.mobile}</td>
                        <td>{c.city || '—'}</td>
                        <td><span className="badge badge-slate">{c.petCount || 0} pets</span></td>
                        <td className="text-slate-500 text-xs">{formatDateTime(c.createdAt)}</td>
                        <td><span className={`badge ${c.status === 'ACTIVE' ? 'badge-green' : 'badge-red'}`}>{c.status}</span></td>
                        <td>
                          <div className="flex gap-2">
                            <Link to={`/admin/clients/${c._id}`} className="btn btn-secondary btn-sm">
                              <EyeIcon className="h-3.5 w-3.5" /> View
                            </Link>
                            <button onClick={() => setModal(c)} className="btn btn-secondary btn-sm">
                              <PencilIcon className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Pagination page={page} total={total} limit={15} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Create Modal */}
      <Modal isOpen={modal === 'create'} onClose={() => setModal(null)} title="Add New Client" size="lg">
        <ClientForm onSubmit={handleCreate} loading={saving} />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={modal && modal !== 'create'} onClose={() => setModal(null)} title="Edit Client" size="lg">
        {modal && modal !== 'create' && (
          <ClientForm initial={modal} onSubmit={handleUpdate} loading={saving} />
        )}
      </Modal>
    </div>
  );
}
