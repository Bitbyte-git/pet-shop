import { useState, useEffect, useCallback } from 'react';
import { clinicAPI, clientAPI, petAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import { formatDate, formatDateTime, errorMessage } from '../../utils/helpers';
import { PlusIcon, EyeIcon, CheckCircleIcon, CalendarIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function ConsultationsPage() {
  const [consultations, setConsultations] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(false);
  const [viewModal, setViewModal] = useState(null);
  const [completeModal, setCompleteModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [clientResults, setClientResults] = useState([]);
  const [pets, setPets] = useState([]);
  const [form, setForm] = useState({ client: '', pet: '', visitDate: '', symptoms: '', diagnosis: '', temperature: '', weight: '', notes: '', doctor: '', followUpDate: '' });
  const [completeForm, setCompleteForm] = useState({ diagnosis: '', followUpDate: '', followUpReason: '', notes: '' });
  const [clientMode, setClientMode] = useState('existing'); // 'existing' or 'new'
  const [newClientForm, setNewClientForm] = useState({ name: '', mobile: '', address: '' });
  const [newPetForm, setNewPetForm] = useState({ name: '', species: '', customSpecies: '', breed: '', gender: '', age: '', weight: '' });
  const [showAddPetForExisting, setShowAddPetForExisting] = useState(false);
  const [isCustomSpecies, setIsCustomSpecies] = useState(false);

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
    setPets([]); // Clear pets first
    try {
      const r = await petAPI.getByOwner(client._id);
      if (r.data && r.data.pets) {
        setPets(r.data.pets);
        if (r.data.pets.length === 0) {
          toast(`No pets found for ${client.name}. Please register a new pet below.`);
        } else {
          toast.success(`Found ${r.data.pets.length} pet(s) for ${client.name}`);
        }
      } else {
        toast(`No pets found for ${client.name}. Please register a new pet below.`);
      }
    } catch (err) {
      console.error('Error fetching pets:', err);
      toast.error('Failed to fetch pets for this client');
      setPets([]);
    }
  };

  const handleCreateNewClientPet = async () => {
    setSaving(true);
    try {
      // Step 1: Create new client
      const clientRes = await clientAPI.create(newClientForm);
      const newClientId = clientRes.data.client._id;

      // Step 2: Create new pet for this client (note: Pet model uses 'owner' field)
      const petData = {
        ...newPetForm,
        owner: newClientId, // Pet model expects 'owner' not 'client'
      };
      // If custom species is set, use it instead of 'Other'
      if (isCustomSpecies && newPetForm.customSpecies) {
        petData.species = newPetForm.customSpecies;
      }
      delete petData.customSpecies; // Remove the custom field before sending

      const petRes = await petAPI.create(petData);

      // Step 3: Set form with new client and pet
      setForm((f) => ({
        ...f,
        client: newClientId,
        pet: petRes.data.pet._id,
      }));

      // Step 4: Clear forms and switch to existing mode
      setNewClientForm({ name: '', mobile: '', address: '' });
      setNewPetForm({ name: '', species: '', customSpecies: '', breed: '', gender: '', age: '', weight: '' });
      setIsCustomSpecies(false);
      setClientMode('existing');
      setClientSearch(clientRes.data.client.name);

      toast.success('New client and pet registered successfully!');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleAddPetForExistingClient = async () => {
    setSaving(true);
    try {
      const petData = {
        ...newPetForm,
        owner: form.client, // Use the selected client's ID
      };
      // If custom species is set, use it instead of 'Other'
      if (isCustomSpecies && newPetForm.customSpecies) {
        petData.species = newPetForm.customSpecies;
      }
      delete petData.customSpecies; // Remove the custom field before sending

      const petRes = await petAPI.create(petData);

      // Refresh pets list
      const r = await petAPI.getByOwner(form.client);
      setPets(r.data.pets || []);

      // Select the newly created pet
      setForm((f) => ({ ...f, pet: petRes.data.pet._id }));

      // Clear pet form
      setNewPetForm({ name: '', species: '', customSpecies: '', breed: '', gender: '', age: '', weight: '' });
      setIsCustomSpecies(false);
      setShowAddPetForExisting(false);

      toast.success('New pet registered successfully!');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await clinicAPI.createConsultation(form);
      toast.success('Consultation recorded. Pet is now in consultation.');
      setModal(false);
      fetch();
    } catch (err) { toast.error(errorMessage(err)); }
    finally { setSaving(false); }
  };

  const handleComplete = (consultation) => {
    setCompleteModal(consultation);
    setCompleteForm({
      diagnosis: consultation.diagnosis || '',
      followUpDate: consultation.followUpDate ? consultation.followUpDate.split('T')[0] : '',
      followUpReason: consultation.followUpReason || '',
      notes: consultation.notes || '',
    });
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await clinicAPI.completeConsultation(completeModal._id, completeForm);
      toast.success('Consultation completed.');
      setCompleteModal(null);
      setCompleteForm({ diagnosis: '', followUpDate: '', followUpReason: '', notes: '' });
      fetch();
    } catch (err) { toast.error(errorMessage(err)); }
    finally { setSaving(false); }
  };

  const handleCompleteFollowUp = async (consultation) => {
    try {
      await clinicAPI.completeFollowUp(consultation._id);
      toast.success('Follow-up marked as completed.');
      fetch();
    } catch (err) { toast.error(errorMessage(err)); }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'OPEN': return 'badge-yellow';
      case 'IN_PROGRESS': return 'badge-blue';
      case 'COMPLETED': return 'badge-green';
      case 'FOLLOW_UP_SCHEDULED': return 'badge-amber';
      case 'FOLLOW_UP_COMPLETED': return 'badge-green';
      default: return 'badge-slate';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'OPEN': return 'In Queue';
      case 'IN_PROGRESS': return 'In Progress';
      case 'COMPLETED': return 'Completed';
      case 'FOLLOW_UP_SCHEDULED': return 'Follow-up Scheduled';
      case 'FOLLOW_UP_COMPLETED': return 'Follow-up Done';
      default: return status;
    }
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
                  <th>Date</th><th>Client</th><th>Pet</th><th>Symptoms</th><th>Doctor</th><th>Diagnosis</th><th>Follow-up</th><th>Status</th><th>Actions</th>
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
                      <td className="max-w-xs truncate">{c.symptoms || '—'}</td>
                      <td>{c.doctor || '—'}</td>
                      <td className="max-w-xs truncate">{c.diagnosis || '—'}</td>
                      <td>
                        {c.followUpDate ? (
                          <div>
                            <span className="badge badge-amber">{formatDate(c.followUpDate)}</span>
                            {c.followUpCompleted && <span className="badge badge-green ml-1">Done</span>}
                          </div>
                        ) : '—'}
                      </td>
                      <td><span className={`badge ${getStatusBadge(c.status)}`}>{getStatusLabel(c.status)}</span></td>
                      <td className="flex gap-1">
                        <button onClick={() => setViewModal(c)} className="btn btn-secondary btn-sm"><EyeIcon className="h-3.5 w-3.5" /></button>
                        {(c.status === 'OPEN' || c.status === 'IN_PROGRESS') && (
                          <button onClick={() => handleComplete(c)} className="btn btn-primary btn-sm"><CheckCircleIcon className="h-3.5 w-3.5" /></button>
                        )}
                        {c.status === 'FOLLOW_UP_SCHEDULED' && !c.followUpCompleted && (
                          <button onClick={() => handleCompleteFollowup(c)} className="btn btn-success btn-sm" title="Mark Follow-up Complete">
                            <CalendarIcon className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} total={total} limit={15} onPageChange={setPage} />
          </>
        )}
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="New Consultation" size="xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Client Selection/Registration */}
          <div className="border-b border-slate-200 pb-4">
            <h3 className="font-semibold text-slate-800 mb-3">Step 1: Client & Pet</h3>
            
            {/* Toggle between existing and new client */}
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setClientMode('existing')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  clientMode === 'existing'
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Existing Client
              </button>
              <button
                type="button"
                onClick={() => setClientMode('new')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  clientMode === 'new'
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Register New Client
              </button>
            </div>

            {clientMode === 'existing' ? (
              <div className="relative">
                <label className="label">Search Existing Client *</label>
                <input
                  className="input"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  placeholder="Type client name to search..."
                  required={clientMode === 'existing'}
                />
                {clientResults.length > 0 && (
                  <div className="absolute z-10 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {clientResults.map((c) => (
                      <button
                        type="button"
                        key={c._id}
                        onClick={() => selectClient(c)}
                        className="w-full flex justify-between px-4 py-2 hover:bg-slate-50 text-sm border-b border-slate-100 last:border-0"
                      >
                        <span className="font-medium">{c.name}</span>
                        <span className="text-slate-400">{c.mobile} · {c.clientId}</span>
                      </button>
                    ))}
                  </div>
                )}
                {form.client && (
                  <div className="mt-2">
                    <label className="label">Select Pet *</label>
                    {pets.length > 0 ? (
                      <select
                        className="input"
                        value={form.pet}
                        onChange={(e) => setForm({ ...form, pet: e.target.value })}
                        required
                      >
                        <option value="">Select pet</option>
                        {pets.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.name} ({p.species}) - {p.breed || 'No breed'}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-amber-600">No pets found for this client.</p>
                        <button
                          type="button"
                          onClick={() => setShowAddPetForExisting(true)}
                          className="btn btn-secondary btn-sm"
                        >
                          + Register New Pet for {clientSearch}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                  Register a new client and their pet in one step
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Client Name *</label>
                    <input
                      className="input"
                      value={newClientForm.name}
                      onChange={(e) => setNewClientForm({ ...newClientForm, name: e.target.value })}
                      placeholder="Full name"
                      required={clientMode === 'new'}
                    />
                  </div>
                  <div>
                    <label className="label">Mobile Number *</label>
                    <input
                      className="input"
                      value={newClientForm.mobile}
                      onChange={(e) => setNewClientForm({ ...newClientForm, mobile: e.target.value })}
                      placeholder="10-digit number"
                      required={clientMode === 'new'}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="label">Address</label>
                    <input
                      className="input"
                      value={newClientForm.address}
                      onChange={(e) => setNewClientForm({ ...newClientForm, address: e.target.value })}
                      placeholder="Client address"
                    />
                  </div>
                </div>
                <div className="border-t border-slate-200 pt-4">
                  <h4 className="font-medium text-slate-700 mb-3">Pet Details</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="label">Pet Name *</label>
                      <input
                        className="input"
                        value={newPetForm.name}
                        onChange={(e) => setNewPetForm({ ...newPetForm, name: e.target.value })}
                        required={clientMode === 'new'}
                      />
                    </div>
                    <div>
                      <label className="label">Species *</label>
                      <select
                        className="input"
                        value={newPetForm.species}
                        onChange={(e) => {
                          const value = e.target.value;
                          setNewPetForm({ ...newPetForm, species: value });
                          setIsCustomSpecies(value === 'Other');
                        }}
                        required={clientMode === 'new'}
                      >
                        <option value="">Select</option>
                        <option value="Dog">Dog</option>
                        <option value="Cat">Cat</option>
                        <option value="Bird">Bird</option>
                        <option value="Rabbit">Rabbit</option>
                        <option value="Fish">Fish</option>
                        <option value="Hamster">Hamster</option>
                        <option value="Guinea Pig">Guinea Pig</option>
                        <option value="Reptile">Reptile</option>
                        <option value="Turtle">Turtle</option>
                        <option value="Other">Other (Specify)</option>
                      </select>
                      {isCustomSpecies && (
                        <input
                          className="input mt-2"
                          value={newPetForm.customSpecies || ''}
                          onChange={(e) => setNewPetForm({ ...newPetForm, customSpecies: e.target.value })}
                          placeholder="Enter species name..."
                          required={clientMode === 'new'}
                        />
                      )}
                    </div>
                    <div>
                      <label className="label">Breed</label>
                      <input
                        className="input"
                        value={newPetForm.breed}
                        onChange={(e) => setNewPetForm({ ...newPetForm, breed: e.target.value })}
                        placeholder="e.g., Labrador, Persian, Beta (Fish)"
                      />
                    </div>
                    <div>
                      <label className="label">Gender</label>
                      <select
                        className="input"
                        value={newPetForm.gender}
                        onChange={(e) => setNewPetForm({ ...newPetForm, gender: e.target.value })}
                      >
                        <option value="">Select</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="UNKNOWN">Unknown</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Age</label>
                      <input
                        className="input"
                        value={newPetForm.age}
                        onChange={(e) => setNewPetForm({ ...newPetForm, age: e.target.value })}
                        placeholder="e.g., 2 years"
                      />
                    </div>
                    <div>
                      <label className="label">Weight (kg)</label>
                      <input
                        className="input"
                        type="number"
                        step="0.1"
                        value={newPetForm.weight}
                        onChange={(e) => setNewPetForm({ ...newPetForm, weight: e.target.value })}
                        placeholder="Current weight"
                      />
                    </div>
                  </div>
                </div>
                {clientMode === 'new' && (
                  <button
                    type="button"
                    onClick={handleCreateNewClientPet}
                    disabled={saving}
                    className="btn btn-primary w-full"
                  >
                    {saving ? 'Registering...' : 'Register Client & Pet'}
                  </button>
                )}
              </div>
            )}

            {/* Add Pet for Existing Client Modal */}
            {showAddPetForExisting && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-3">Register New Pet for {clientSearch}</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="label text-xs">Pet Name *</label>
                    <input
                      className="input text-sm"
                      value={newPetForm.name}
                      onChange={(e) => setNewPetForm({ ...newPetForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="label text-xs">Species *</label>
                    <select
                      className="input text-sm"
                      value={newPetForm.species}
                      onChange={(e) => {
                        const value = e.target.value;
                        setNewPetForm({ ...newPetForm, species: value });
                        setIsCustomSpecies(value === 'Other');
                      }}
                      required
                    >
                      <option value="">Select</option>
                      <option value="Dog">Dog</option>
                      <option value="Cat">Cat</option>
                      <option value="Bird">Bird</option>
                      <option value="Rabbit">Rabbit</option>
                      <option value="Fish">Fish</option>
                      <option value="Hamster">Hamster</option>
                      <option value="Guinea Pig">Guinea Pig</option>
                      <option value="Reptile">Reptile</option>
                      <option value="Turtle">Turtle</option>
                      <option value="Other">Other (Specify)</option>
                    </select>
                    {isCustomSpecies && (
                      <input
                        className="input text-sm mt-2"
                        value={newPetForm.customSpecies || ''}
                        onChange={(e) => setNewPetForm({ ...newPetForm, customSpecies: e.target.value })}
                        placeholder="Enter species name..."
                        required
                      />
                    )}
                  </div>
                  <div>
                    <label className="label text-xs">Breed</label>
                    <input
                      className="input text-sm"
                      value={newPetForm.breed}
                      onChange={(e) => setNewPetForm({ ...newPetForm, breed: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label text-xs">Gender</label>
                    <select
                      className="input text-sm"
                      value={newPetForm.gender}
                      onChange={(e) => setNewPetForm({ ...newPetForm, gender: e.target.value })}
                    >
                      <option value="">Select</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="UNKNOWN">Unknown</option>
                    </select>
                  </div>
                  <div>
                    <label className="label text-xs">Age</label>
                    <input
                      className="input text-sm"
                      value={newPetForm.age}
                      onChange={(e) => setNewPetForm({ ...newPetForm, age: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label text-xs">Weight (kg)</label>
                    <input
                      className="input text-sm"
                      type="number"
                      step="0.1"
                      value={newPetForm.weight}
                      onChange={(e) => setNewPetForm({ ...newPetForm, weight: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={handleAddPetForExistingClient}
                    disabled={saving}
                    className="btn btn-primary btn-sm"
                  >
                    {saving ? 'Adding...' : 'Add Pet'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddPetForExisting(false);
                      setNewPetForm({ name: '', species: '', breed: '', gender: '', age: '', weight: '' });
                      setIsCustomSpecies(false);
                    }}
                    className="btn btn-secondary btn-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Consultation Details */}
          <div>
            <h3 className="font-semibold text-slate-800 mb-3">Step 2: Consultation Details</h3>
            <div className="form-grid">
              <div>
                <label className="label">Visit Date *</label>
                <input
                  className="input"
                  type="datetime-local"
                  value={form.visitDate}
                  onChange={(e) => setForm({ ...form, visitDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Doctor</label>
                <input
                  className="input"
                  value={form.doctor}
                  onChange={(e) => setForm({ ...form, doctor: e.target.value })}
                  placeholder="Doctor's name"
                />
              </div>
              <div>
                <label className="label">Temperature (°C)</label>
                <input
                  className="input"
                  type="number"
                  step="0.1"
                  value={form.temperature}
                  onChange={(e) => setForm({ ...form, temperature: e.target.value })}
                  placeholder="e.g., 38.5"
                />
              </div>
              <div>
                <label className="label">Weight (kg)</label>
                <input
                  className="input"
                  type="number"
                  step="0.1"
                  value={form.weight}
                  onChange={(e) => setForm({ ...form, weight: e.target.value })}
                  placeholder="Current weight"
                />
              </div>
              <div className="md:col-span-2">
                <label className="label">Symptoms / Reason for Visit *</label>
                <textarea
                  className="input resize-none"
                  rows={3}
                  value={form.symptoms}
                  onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
                  placeholder="Describe the pet's symptoms or reason for visit..."
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="label">Diagnosis</label>
                <textarea
                  className="input resize-none"
                  rows={2}
                  value={form.diagnosis}
                  onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
                  placeholder="Doctor's diagnosis (fill after consultation)..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="label">Notes</label>
                <textarea
                  className="input resize-none"
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Additional notes..."
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setModal(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Record Consultation'}
            </button>
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
            {viewModal.followUpDate && (
              <div>
                <span className="text-slate-500">Follow-up:</span>
                <span className="badge badge-amber ml-2">{formatDate(viewModal.followUpDate)}</span>
                {viewModal.followUpCompleted && <span className="badge badge-green ml-1">Completed on {formatDate(viewModal.followUpCompletedDate)}</span>}
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal isOpen={!!completeModal} onClose={() => setCompleteModal(null)} title="Complete Consultation" size="lg">
        {completeModal && (
          <form onSubmit={handleCompleteSubmit} className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg text-sm mb-4">
              <p><span className="font-medium">Client:</span> {completeModal.client?.name}</p>
              <p><span className="font-medium">Pet:</span> {completeModal.pet?.name} ({completeModal.pet?.species})</p>
              <p><span className="font-medium">Symptoms:</span> {completeModal.symptoms}</p>
            </div>
            <div>
              <label className="label">Diagnosis *</label>
              <textarea
                className="input resize-none"
                rows={3}
                value={completeForm.diagnosis}
                onChange={(e) => setCompleteForm({ ...completeForm, diagnosis: e.target.value })}
                placeholder="Enter the diagnosis from the doctor..."
                required
              />
            </div>
            <div>
              <label className="label">Follow-up Date (Optional)</label>
              <input
                className="input"
                type="date"
                value={completeForm.followUpDate}
                onChange={(e) => setCompleteForm({ ...completeForm, followUpDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
              />
              <p className="text-xs text-slate-500 mt-1">Schedule a follow-up if the pet needs to visit again</p>
            </div>
            {completeForm.followUpDate && (
              <div>
                <label className="label">Follow-up Reason</label>
                <input
                  className="input"
                  value={completeForm.followUpReason}
                  onChange={(e) => setCompleteForm({ ...completeForm, followUpReason: e.target.value })}
                  placeholder="e.g., Check vaccination status, Review treatment progress..."
                />
              </div>
            )}
            <div>
              <label className="label">Notes</label>
              <textarea
                className="input resize-none"
                rows={2}
                value={completeForm.notes}
                onChange={(e) => setCompleteForm({ ...completeForm, notes: e.target.value })}
                placeholder="Additional notes..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setCompleteModal(null)} className="btn btn-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Completing...' : 'Complete Consultation'}</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
