import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { clientAPI, petAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import { formatDate, formatDateTime, errorMessage } from '../../utils/helpers';
import { ArrowLeftIcon, PlusIcon, HeartIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const PET_FORM_EMPTY = { name: '', species: 'Dog', breed: '', gender: 'MALE', dateOfBirth: '', weight: '', color: '', allergies: '', existingConditions: '', medicalNotes: '' };

const SPECIES = ['Dog', 'Cat', 'Bird', 'Rabbit', 'Hamster', 'Fish', 'Turtle', 'Other'];

function AddPetForm({ ownerId, onSuccess, onClose }) {
  const [form, setForm] = useState(PET_FORM_EMPTY);
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await petAPI.create({
        ...form,
        owner: ownerId,
        allergies: form.allergies ? form.allergies.split(',').map((s) => s.trim()) : [],
        existingConditions: form.existingConditions ? form.existingConditions.split(',').map((s) => s.trim()) : [],
        weight: form.weight ? Number(form.weight) : undefined,
      });
      toast.success('Pet added successfully.');
      onSuccess();
      onClose();
    } catch (err) { toast.error(errorMessage(err)); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="form-grid">
        <div>
          <label className="label">Pet Name *</label>
          <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} required placeholder="Bruno" />
        </div>
        <div>
          <label className="label">Species *</label>
          <select className="input" value={form.species} onChange={(e) => set('species', e.target.value)}>
            {SPECIES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Breed</label>
          <input className="input" value={form.breed} onChange={(e) => set('breed', e.target.value)} placeholder="Labrador" />
        </div>
        <div>
          <label className="label">Gender</label>
          <select className="input" value={form.gender} onChange={(e) => set('gender', e.target.value)}>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="UNKNOWN">Unknown</option>
          </select>
        </div>
        <div>
          <label className="label">Date of Birth</label>
          <input className="input" type="date" value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} />
        </div>
        <div>
          <label className="label">Weight (kg)</label>
          <input className="input" type="number" step="0.1" value={form.weight} onChange={(e) => set('weight', e.target.value)} placeholder="5.2" />
        </div>
        <div>
          <label className="label">Color / Coat</label>
          <input className="input" value={form.color} onChange={(e) => set('color', e.target.value)} />
        </div>
        <div>
          <label className="label">Allergies (comma separated)</label>
          <input className="input" value={form.allergies} onChange={(e) => set('allergies', e.target.value)} placeholder="Peanuts, Wheat" />
        </div>
        <div className="md:col-span-2">
          <label className="label">Existing Conditions</label>
          <input className="input" value={form.existingConditions} onChange={(e) => set('existingConditions', e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <label className="label">Medical Notes</label>
          <textarea className="input resize-none" rows={2} value={form.medicalNotes} onChange={(e) => set('medicalNotes', e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Adding...' : 'Add Pet'}</button>
      </div>
    </form>
  );
}

export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddPet, setShowAddPet] = useState(false);

  const fetch = () => {
    setLoading(true);
    clientAPI.getById(id)
      .then((res) => setClient(res.data.client))
      .catch(() => toast.error('Client not found.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!client) return <div className="text-center text-slate-500 py-20">Client not found.</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="btn btn-secondary btn-sm">
          <ArrowLeftIcon className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h1 className="page-title">{client.name}</h1>
          <p className="page-subtitle">Client ID: {client.clientId}</p>
        </div>
        <button onClick={() => setShowAddPet(true)} className="btn-primary">
          <PlusIcon className="h-4 w-4" /> Add Pet
        </button>
      </div>

      {/* Client info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card card-body">
          <h3 className="font-semibold text-slate-700 mb-4">Client Information</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Client ID</span><span className="badge badge-blue font-mono">{client.clientId}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Mobile</span><span className="font-medium">{client.mobile}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Email</span><span>{client.email || '—'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">City</span><span>{client.city || '—'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Address</span><span className="text-right max-w-32 text-xs">{client.address || '—'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Emergency</span><span>{client.emergencyContactName || '—'} {client.emergencyContact ? `(${client.emergencyContact})` : ''}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Status</span><span className={`badge ${client.status === 'ACTIVE' ? 'badge-green' : 'badge-red'}`}>{client.status}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Joined</span><span>{formatDate(client.createdAt)}</span></div>
          </div>
          {client.notes && <p className="mt-4 p-3 bg-slate-50 rounded-lg text-sm text-slate-600">{client.notes}</p>}
        </div>

        {/* Pets & Billing History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pets Card */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="font-semibold text-slate-700">Pets ({client.pets?.length || 0})</h3>
              <button onClick={() => setShowAddPet(true)} className="btn btn-secondary btn-sm">
                <PlusIcon className="h-3.5 w-3.5" /> Add Pet
              </button>
            </div>
            {!client.pets?.length ? (
              <div className="flex flex-col items-center py-8 text-center">
                <HeartIcon className="h-10 w-10 text-slate-200 mb-2" />
                <p className="text-slate-400 text-sm">No pets registered yet</p>
                <button onClick={() => setShowAddPet(true)} className="btn-primary btn-sm mt-3">Add First Pet</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6">
                {client.pets.map((pet) => (
                  <Link key={pet._id} to={`/admin/pets/${pet._id}`}
                    className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl hover:border-primary-400 hover:bg-primary-50 transition-all group">
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                      {pet.species === 'Cat' ? '🐱' : pet.species === 'Bird' ? '🐦' : '🐶'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 group-hover:text-primary-700">{pet.name}</p>
                      <p className="text-xs text-slate-500">{pet.petId}</p>
                      <p className="text-xs text-slate-400">{pet.species} · {pet.breed || 'Mixed'} · {pet.gender}</p>
                    </div>
                    <span className={`badge ${pet.status === 'ACTIVE' ? 'badge-green' : 'badge-red'}`}>{pet.status}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Billing & Purchase History Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-slate-700">Purchase & Billing History</h3>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Invoice / Bill #</th>
                    <th>Type</th>
                    <th>Items</th>
                    <th>Grand Total</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(!client.productBills?.length && !client.clinicBills?.length) ? (
                    <tr><td colSpan={6} className="text-center py-8 text-slate-400">No purchases or bills recorded for this client.</td></tr>
                  ) : (
                    <>
                      {client.productBills?.map((b) => (
                        <tr key={b._id}>
                          <td><span className="font-mono font-bold text-primary-700">{b.invoiceNumber}</span></td>
                          <td><span className="badge badge-blue">PRODUCT (GST)</span></td>
                          <td>{b.items?.length || 0} items</td>
                          <td className="font-bold text-money">{formatCurrency(b.grandTotal)}</td>
                          <td><span className="badge badge-green">{b.paymentStatus}</span></td>
                          <td className="text-xs text-slate-500">{formatDate(b.createdAt)}</td>
                        </tr>
                      ))}
                      {client.clinicBills?.map((b) => (
                        <tr key={b._id}>
                          <td><span className="font-mono font-bold text-amber-800">{b.clinicBillId}</span></td>
                          <td><span className="badge badge-amber">CLINIC (NO GST)</span></td>
                          <td>{b.items?.length || 0} items</td>
                          <td className="font-bold text-money">{formatCurrency(b.totalAmount)}</td>
                          <td><span className="badge badge-green">ACTIVE</span></td>
                          <td className="text-xs text-slate-500">{formatDate(b.createdAt)}</td>
                        </tr>
                      ))}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={showAddPet} onClose={() => setShowAddPet(false)} title="Add New Pet" size="lg">
        <AddPetForm ownerId={client._id} onSuccess={fetch} onClose={() => setShowAddPet(false)} />
      </Modal>
    </div>
  );
}
