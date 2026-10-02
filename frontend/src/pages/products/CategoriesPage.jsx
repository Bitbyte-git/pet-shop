import { useState, useEffect } from 'react';
import { categoryAPI } from '../../services/api';
import Modal from '../../components/common/Modal';
import { PlusIcon, PencilIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { errorMessage } from '../../utils/helpers';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: '', prefix: '', description: '' });
  const [saving, setSaving] = useState(false);

  const load = () => categoryAPI.getAll().then((r) => setCategories(r.data.categories));
  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm({ name: '', prefix: '', description: '' }); setModal('create'); };
  const openEdit = (c) => { setForm({ name: c.name, prefix: c.prefix || '', description: c.description || '' }); setModal(c); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === 'create') {
        await categoryAPI.create(form);
        toast.success('Category created.');
      } else {
        await categoryAPI.update(modal._id, form);
        toast.success('Category updated.');
      }
      setModal(null);
      load();
    } catch (err) { toast.error(errorMessage(err)); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <h1 className="page-title">Product Categories</h1>
        <button onClick={openCreate} className="btn-primary"><PlusIcon className="h-4 w-4" /> Add Category</button>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead><tr><th>Name</th><th>Prefix</th><th>Description</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c._id}>
                  <td className="font-medium">{c.name}</td>
                  <td><span className="badge badge-blue font-mono">{c.prefix || '—'}</span></td>
                  <td className="text-slate-500">{c.description || '—'}</td>
                  <td><span className="badge badge-green">{c.status}</span></td>
                  <td><button onClick={() => openEdit(c)} className="btn btn-secondary btn-sm"><PencilIcon className="h-3.5 w-3.5" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={!!modal} onClose={() => setModal(null)} title={modal === 'create' ? 'Add Category' : 'Edit Category'} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Category Name *</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Code Prefix (e.g. MED, FOOD)</label>
            <input className="input font-mono uppercase" value={form.prefix} onChange={(e) => setForm({ ...form, prefix: e.target.value.toUpperCase() })} placeholder="MED" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
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
