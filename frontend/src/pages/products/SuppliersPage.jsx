import { useState, useEffect } from 'react';
import { supplierAPI } from '../../services/api';
import Modal from '../../components/common/Modal';
import { PlusIcon, PencilIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { errorMessage } from '../../utils/helpers';

const EMPTY = { name: '', contactPerson: '', mobile: '', email: '', address: '', gstin: '' };

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => supplierAPI.getAll().then((r) => setSuppliers(r.data.suppliers));
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === 'create') { await supplierAPI.create(form); toast.success('Supplier added.'); }
      else { await supplierAPI.update(modal._id, form); toast.success('Supplier updated.'); }
      setModal(null);
      load();
    } catch (err) { toast.error(errorMessage(err)); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <h1 className="page-title">Suppliers</h1>
        <button onClick={() => { setForm(EMPTY); setModal('create'); }} className="btn-primary">
          <PlusIcon className="h-4 w-4" /> Add Supplier
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead><tr><th>Name</th><th>Contact Person</th><th>Mobile</th><th>Email</th><th>GSTIN</th><th>Actions</th></tr></thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s._id}>
                  <td className="font-medium">{s.name}</td>
                  <td>{s.contactPerson || '—'}</td>
                  <td>{s.mobile || '—'}</td>
                  <td>{s.email || '—'}</td>
                  <td><span className="font-mono text-xs">{s.gstin || '—'}</span></td>
                  <td><button onClick={() => { setForm({ ...EMPTY, ...s }); setModal(s); }} className="btn btn-secondary btn-sm"><PencilIcon className="h-3.5 w-3.5" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={!!modal} onClose={() => setModal(null)} title={modal === 'create' ? 'Add Supplier' : 'Edit Supplier'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-grid">
            <div className="md:col-span-2">
              <label className="label">Supplier Name *</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div><label className="label">Contact Person</label><input className="input" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} /></div>
            <div><label className="label">Mobile</label><input className="input" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} /></div>
            <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><label className="label">GSTIN</label><input className="input font-mono" value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })} /></div>
            <div className="md:col-span-2"><label className="label">Address</label><textarea className="input resize-none" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setModal(null)} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
