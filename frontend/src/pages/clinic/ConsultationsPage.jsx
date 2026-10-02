import { useState, useEffect, useCallback } from 'react';
import { clinicAPI, clientAPI, petAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import { formatDate, formatDateTime, errorMessage } from '../../utils/helpers';
import { PlusIcon, EyeIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function ConsultationsPage() {
  const [consultations, setConsultations] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(false);
  const [viewModal, setViewModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [clientResults, setClientResults] = useState([]);
  const [pets, setPets] = useState([]);
  const [form, setForm] = useState({ client: '', pet: '', visitDate: '', symptoms: '', diagnosis: '', temperature: '', weight: '', notes: '', doctor: '', followUpDate: '' });

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const r = await clinicAPI.getConsultations({ page, limit: 15 });
      setConsultations(r.data.consultations || []);
      setTotal(r.data.total || 0);
    } catch {}
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    if (clientSearch.length < 2) { setClientResults([]); return; }
    const t = setTimeout(() => {
      clientAPI.search(clientSearch).then((r) => setClientResults(r.data.clients || []));
    }, 300);
    return () => clearTimeout(t);
  }, [clientSearch]);

  const selectClient = async (client) => {
    setForm((f) => ({ ...f, client: client._id }));
    setClientSearch(client.name);
    setClientResults([]);
    const r = await petAPI.getByOwner(client._id);
    setPets(r.data.pets || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await clinicAPI.createConsultation(form);
      toast.success('Consultation recorded.');
      setModal(false);
      fetch();
    } catch (err) { toast.error(errorMessage(err)); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div><h1 className="page-title">Consultations</h1><p className="page-subtitle">Clinic visit records</p></div>
        <button onClick={() => setModal(true)} className="btn-primary"><PlusIcon className="h-4 w-4" /> New Consultation</button>
      </div>

      <div className="card">
        {loading ? <LoadingSpinner /> : (
          <>
            <div className="table-container">
              <table className="table">
                <thead><tr>
                  <th>Date</th><th>Client</th><th>Pet</th><th>Doctor</th><th>Diagnosis</th><th>Follow-up</th><th>Status</th><th>Actions</th>
                </tr></thead>
                <tbody>
                  {consultations.map((c) => (
                    <tr key={c._id}>
                      <td>{formatDate(c.visitDate)}</td>
                      <td>
                        <p className="font-medium">{c.client?.name}</p>
                        <p className="text-xs text-slate-400">{c.client?.clientId}</p>
                      </td>
                      <td>{c.pet?.name} <span className="text-xs text-slate-400">({c.pet?.species})</span></td>
                      <td>{c.doctor || '—'}</td>
                      <td className="max-w-xs truncate">{c.diagnosis || '—'}</td>
                      <td>{formatDate(c.followUpDate)}</td>
                      <td><span className={`badge ${c.status === 'COMPLETED' ? 'badge-green' : 'badge-yellow'}`}>{c.status}</span></td>
                      <td><button onClick={() => setViewModal(c)} className="btn btn-secondary btn-sm"><EyeIcon className="h-3.5 w-3.5" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} total={total} limit={15} onPageChange={setPage} />
          </>
        )}
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="New Consultation" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-grid">
            <div className="md:col-span-2 relative">
              <label className="label">Client *</label>
              <input className="input" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} placeholder="Search client..." required={!form.client} />
              {clientResults.length > 0 && (
                <div className="absolute z-10 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg">
                  {clientResults.map((c) => (
                    <button type="button" key={c._id} onClick={() => selectClient(c)} className="w-full flex justify-between px-4 py-2 hover:bg-slate-50 text-sm">
                      <span className="font-medium">{c.name}</span>
                      <span className="text-slate-400">{c.mobile} · {c.clientId}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="label">Pet *</label>
              <select className="input" value={form.pet} onChange={(e) => setForm({ ...form, pet: e.target.value })} required>
                <option value="">Select pet</option>
                {pets.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.species})</option>)}
              </select>
            </div>
            <div>
              <label className="label">Visit Date *</label>
              <input className="input" type="datetime-local" value={form.visitDate} onChange={(e) => setForm({ ...form, visitDate: e.target.value })} required />
            </div>
            <div>
              <label className="label">Doctor</label>
              <input className="input" value={form.doctor} onChange={(e) => setForm({ ...form, doctor: e.target.value })} />
            </div>
            <div>
              <label className="label">Temperature (°C)</label>
              <input className="input" type="number" step="0.1" value={form.temperature} onChange={(e) => setForm({ ...form, temperature: e.target.value })} />
            </div>
            <div>
              <label className="label">Weight (kg)</label>
              <input className="input" type="number" step="0.1" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="label">Symptoms</label>
              <textarea className="input resize-none" rows={2} value={form.symptoms} onChange={(e) => setForm({ ...form, symptoms: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="label">Diagnosis</label>
              <textarea className="input resize-none" rows={2} value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="label">Notes</label>
              <textarea className="input resize-none" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div>
              <label className="label">Follow-up Date</label>
              <input className="input" type="date" value={form.followUpDate} onChange={(e) => setForm({ ...form, followUpDate: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setModal(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Record Consultation'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!viewModal} onClose={() => setViewModal(null)} title="Consultation Details" size="lg">
        {viewModal && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><span className="text-slate-500">Client:</span> <span className="font-medium">{viewModal.client?.name}</span></div>
              <div><span className="text-slate-500">Pet:</span> <span className="font-medium">{viewModal.pet?.name} ({viewModal.pet?.species})</span></div>
              <div><span className="text-slate-500">Visit Date:</span> {formatDateTime(viewModal.visitDate)}</div>
              <div><span className="text-slate-500">Doctor:</span> {viewModal.doctor || '—'}</div>
              <div><span className="text-slate-500">Temperature:</span> {viewModal.temperature ? `${viewModal.temperature}°C` : '—'}</div>
              <div><span className="text-slate-500">Weight:</span> {viewModal.weight ? `${viewModal.weight} kg` : '—'}</div>
            </div>
            {viewModal.symptoms && <div><p className="font-medium text-slate-700">Symptoms:</p><p className="text-slate-600">{viewModal.symptoms}</p></div>}
            {viewModal.diagnosis && <div><p className="font-medium text-slate-700">Diagnosis:</p><p className="text-slate-600">{viewModal.diagnosis}</p></div>}
            {viewModal.notes && <div><p className="font-medium text-slate-700">Notes:</p><p className="text-slate-600">{viewModal.notes}</p></div>}
            {viewModal.followUpDate && <div><span className="text-slate-500">Follow-up:</span> <span className="badge badge-yellow">{formatDate(viewModal.followUpDate)}</span></div>}
          </div>
        )}
      </Modal>
    </div>
  );
}
