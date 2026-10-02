import { useState, useEffect, useCallback } from 'react';
import { clinicAPI, clientAPI, petAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import { formatCurrency, formatDate, formatDateTime, errorMessage } from '../../utils/helpers';
import { PlusIcon, EyeIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ITEM_TYPES = ['CONSULTATION', 'TREATMENT', 'EQUIPMENT', 'PRODUCT'];

export default function ClinicBillingPage() {
  const [bills, setBills] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(false);
  const [viewModal, setViewModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [clientResults, setClientResults] = useState([]);
  const [pets, setPets] = useState([]);
  const [form, setForm] = useState({ clientId: '', petId: '', consultationId: '', notes: '', items: [{ type: 'CONSULTATION', description: '', quantity: 1, unitCost: '' }] });

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const r = await clinicAPI.getClinicBillings({ page, limit: 15 });
      setBills(r.data.bills || []);
      setTotal(r.data.total || 0);
    } catch {}
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    if (clientSearch.length < 2) { setClientResults([]); return; }
    const t = setTimeout(() => { clientAPI.search(clientSearch).then((r) => setClientResults(r.data.clients || [])); }, 300);
    return () => clearTimeout(t);
  }, [clientSearch]);

  const selectClient = async (client) => {
    setForm((f) => ({ ...f, clientId: client._id }));
    setClientSearch(client.name);
    setClientResults([]);
    const r = await petAPI.getByOwner(client._id);
    setPets(r.data.pets || []);
  };

  const addItem = () => setForm((f) => ({ ...f, items: [...f.items, { type: 'CONSULTATION', description: '', quantity: 1, unitCost: '' }] }));
  const removeItem = (i) => setForm((f) => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i, k, v) => setForm((f) => { const items = [...f.items]; items[i] = { ...items[i], [k]: v }; return { ...f, items }; });

  const totalAmt = form.items.reduce((s, i) => s + (Number(i.quantity || 0) * Number(i.unitCost || 0)), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await clinicAPI.createClinicBilling(form);
      toast.success('Clinic billing record saved. GST: ₹0 (Internal record).');
      setModal(false);
      fetch();
    } catch (err) { toast.error(errorMessage(err)); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Clinic Billing</h1>
          <p className="page-subtitle">Internal records only — No GST, No customer invoice</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary"><PlusIcon className="h-4 w-4" /> New Record</button>
      </div>

      {/* Important notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        ⚠️ <strong>Internal Record:</strong> Clinic billing records are for owner reference only. No GST is applied and no customer-facing invoice is generated.
      </div>

      <div className="card">
        {loading ? <LoadingSpinner /> : (
          <>
            <div className="table-container">
              <table className="table">
                <thead><tr><th>Bill ID</th><th>Client</th><th>Pet</th><th>Items</th><th>Total</th><th>GST</th><th>Date</th><th>Actions</th></tr></thead>
                <tbody>
                  {bills.map((b) => (
                    <tr key={b._id}>
                      <td><span className="badge badge-slate font-mono">{b.clinicBillId}</span></td>
                      <td>{b.client?.name}</td>
                      <td>{b.pet?.name}</td>
                      <td>{b.items?.length} items</td>
                      <td className="text-money">{formatCurrency(b.totalAmount)}</td>
                      <td><span className="badge badge-green">₹0</span></td>
                      <td>{formatDate(b.createdAt)}</td>
                      <td><button onClick={() => setViewModal(b)} className="btn btn-secondary btn-sm"><EyeIcon className="h-3.5 w-3.5" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} total={total} limit={15} onPageChange={setPage} />
          </>
        )}
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="New Clinic Billing Record (Internal)" size="xl">
        <div className="mb-3 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
          This is an internal clinic record. No GST will be added. No customer invoice will be generated.
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-grid">
            <div className="relative">
              <label className="label">Client *</label>
              <input className="input" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} placeholder="Search client..." />
              {clientResults.length > 0 && (
                <div className="absolute z-10 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg">
                  {clientResults.map((c) => (
                    <button type="button" key={c._id} onClick={() => selectClient(c)} className="w-full flex justify-between px-4 py-2 hover:bg-slate-50 text-sm">
                      <span className="font-medium">{c.name}</span><span className="text-slate-400">{c.mobile}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="label">Pet *</label>
              <select className="input" value={form.petId} onChange={(e) => setForm({ ...form, petId: e.target.value })} required>
                <option value="">Select pet</option>
                {pets.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label">Notes</label>
              <input className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-slate-700">Billing Items</h3>
              <button type="button" onClick={addItem} className="btn btn-secondary btn-sm"><PlusIcon className="h-3.5 w-3.5" /> Add</button>
            </div>
            <div className="space-y-2">
              {form.items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-3">
                    {i === 0 && <label className="label text-xs">Type</label>}
                    <select className="input text-sm" value={item.type} onChange={(e) => updateItem(i, 'type', e.target.value)}>
                      {ITEM_TYPES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="col-span-5">
                    {i === 0 && <label className="label text-xs">Description *</label>}
                    <input className="input text-sm" value={item.description} onChange={(e) => updateItem(i, 'description', e.target.value)} required placeholder="e.g. Initial consultation" />
                  </div>
                  <div className="col-span-1">
                    {i === 0 && <label className="label text-xs">Qty</label>}
                    <input className="input text-sm" type="number" min="1" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    {i === 0 && <label className="label text-xs">Cost (₹) *</label>}
                    <input className="input text-sm" type="number" step="0.01" value={item.unitCost} onChange={(e) => updateItem(i, 'unitCost', e.target.value)} required />
                  </div>
                  <div className="col-span-1">
                    <button type="button" onClick={() => removeItem(i)} className="btn btn-danger btn-sm w-full"><TrashIcon className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-end">
              <div className="bg-slate-50 border border-slate-200 rounded-xl px-6 py-3 text-sm">
                <div className="flex justify-between gap-8"><span className="text-slate-500">Subtotal:</span><span className="font-semibold">{formatCurrency(totalAmt)}</span></div>
                <div className="flex justify-between gap-8"><span className="text-slate-500">GST:</span><span className="font-bold text-green-600">₹0.00</span></div>
                <div className="flex justify-between gap-8 border-t mt-2 pt-2"><span className="font-bold text-slate-700">Total:</span><span className="font-bold text-lg">{formatCurrency(totalAmt)}</span></div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t">
            <button type="button" onClick={() => setModal(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Internal Record'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!viewModal} onClose={() => setViewModal(null)} title={`Clinic Record: ${viewModal?.clinicBillId}`} size="lg">
        {viewModal && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><span className="text-slate-500">Client:</span> <span className="font-semibold">{viewModal.client?.name}</span></div>
              <div><span className="text-slate-500">Pet:</span> <span className="font-semibold">{viewModal.pet?.name}</span></div>
              <div><span className="text-slate-500">Date:</span> {formatDateTime(viewModal.createdAt)}</div>
              <div><span className="text-slate-500">Created by:</span> {viewModal.createdBy?.name}</div>
            </div>
            <div className="table-container">
              <table className="table">
                <thead><tr><th>Type</th><th>Description</th><th>Qty</th><th>Unit Cost</th><th>Total</th></tr></thead>
                <tbody>
                  {viewModal.items?.map((it, i) => (
                    <tr key={i}>
                      <td><span className="badge badge-blue">{it.type}</span></td>
                      <td>{it.description}</td>
                      <td>{it.quantity}</td>
                      <td>{formatCurrency(it.unitCost)}</td>
                      <td className="font-semibold">{formatCurrency(it.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end">
              <div className="bg-slate-50 border rounded-xl px-6 py-3 text-sm space-y-1">
                <div className="flex justify-between gap-8"><span className="text-slate-500">Total:</span><span className="font-bold text-lg">{formatCurrency(viewModal.totalAmount)}</span></div>
                <div className="flex justify-between gap-8"><span className="text-slate-500">GST:</span><span className="font-bold text-green-600">₹0.00 (Internal)</span></div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
