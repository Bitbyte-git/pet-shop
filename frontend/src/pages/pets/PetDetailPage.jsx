import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { petAPI, clinicAPI, prescriptionAPI, billingAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate, formatDateTime } from '../../utils/helpers';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const TABS = ['Overview', 'Consultations', 'Prescriptions', 'Billing History'];

export default function PetDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('Overview');
  const [consultations, setConsultations] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [bills, setBills] = useState([]);

  useEffect(() => {
    petAPI.getById(id)
      .then((res) => setPet(res.data.pet))
      .catch(() => toast.error('Pet not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!pet) return;
    if (tab === 'Consultations') {
      clinicAPI.getConsultations({ pet: id }).then((r) => setConsultations(r.data.consultations));
    } else if (tab === 'Prescriptions') {
      prescriptionAPI.getAll({ pet: id }).then((r) => setPrescriptions(r.data.prescriptions));
    } else if (tab === 'Billing History') {
      // No direct pet billing filter in product billing; show from client
    }
  }, [tab, pet, id]);

  if (loading) return <LoadingSpinner />;
  if (!pet) return <div className="text-center text-slate-500 py-20">Pet not found.</div>;

  const emoji = pet.species === 'Cat' ? '🐱' : pet.species === 'Bird' ? '🐦' : '🐶';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="btn btn-secondary btn-sm">
          <ArrowLeftIcon className="h-4 w-4" />
        </button>
        <div>
          <h1 className="page-title">{emoji} {pet.name}</h1>
          <p className="page-subtitle">Pet ID: {pet.petId} · Owner: <Link to={`/admin/clients/${pet.owner?._id}`} className="text-primary-600 hover:underline">{pet.owner?.name}</Link></p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card card-body text-center">
          <div className="text-7xl mb-4">{emoji}</div>
          <h2 className="text-xl font-bold text-slate-800">{pet.name}</h2>
          <p className="badge badge-blue mx-auto mt-1">{pet.petId}</p>
          <div className="mt-4 space-y-2 text-sm text-left">
            <div className="flex justify-between"><span className="text-slate-500">Species</span><span className="font-medium">{pet.species}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Breed</span><span>{pet.breed || '—'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Gender</span><span>{pet.gender}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Age</span><span>{pet.age || '—'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Weight</span><span>{pet.weight ? `${pet.weight} kg` : '—'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Color</span><span>{pet.color || '—'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">DOB</span><span>{formatDate(pet.dateOfBirth)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Status</span><span className={`badge ${pet.status === 'ACTIVE' ? 'badge-green' : 'badge-red'}`}>{pet.status}</span></div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {/* Owner info */}
          <div className="card card-body">
            <h3 className="font-semibold text-slate-700 mb-3">Owner</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-700 font-bold">{pet.owner?.name?.[0]}</span>
              </div>
              <div>
                <p className="font-medium text-slate-800">{pet.owner?.name}</p>
                <p className="text-sm text-slate-500">{pet.owner?.mobile} · {pet.owner?.clientId}</p>
                {pet.owner?.address && <p className="text-xs text-slate-400">{pet.owner.address}</p>}
              </div>
              <Link to={`/admin/clients/${pet.owner?._id}`} className="btn btn-secondary btn-sm ml-auto">View Profile</Link>
            </div>
          </div>

          {/* Medical info */}
          <div className="card card-body">
            <h3 className="font-semibold text-slate-700 mb-3">Medical Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-500 mb-1">Allergies</p>
                {pet.allergies?.length ? (
                  <div className="flex flex-wrap gap-1">{pet.allergies.map((a, i) => <span key={i} className="badge badge-red">{a}</span>)}</div>
                ) : <span className="text-slate-400">None recorded</span>}
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Existing Conditions</p>
                {pet.existingConditions?.length ? (
                  <div className="flex flex-wrap gap-1">{pet.existingConditions.map((c, i) => <span key={i} className="badge badge-yellow">{c}</span>)}</div>
                ) : <span className="text-slate-400">None recorded</span>}
              </div>
            </div>
            {pet.medicalNotes && (
              <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Medical Notes</p>
                <p className="text-sm text-slate-700">{pet.medicalNotes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="border-b border-slate-200 px-6">
          <div className="flex gap-1 -mb-px overflow-x-auto">
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${t === tab ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {tab === 'Overview' && (
            <div className="text-sm text-slate-600 space-y-2">
              <p>Registered on: {formatDateTime(pet.createdAt)}</p>
              {pet.microchipId && <p>Microchip ID: <span className="font-mono font-medium">{pet.microchipId}</span></p>}
              {pet.currentMedication?.length > 0 && (
                <div>
                  <p className="font-medium text-slate-700 mb-1">Current Medications:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {pet.currentMedication.map((m, i) => <li key={i}>{m}</li>)}
                  </ul>
                </div>
              )}
              {pet.vaccinations?.length > 0 && (
                <div className="mt-4">
                  <p className="font-semibold text-slate-700 mb-2">Vaccination History</p>
                  <div className="table-container">
                    <table className="table">
                      <thead><tr><th>Vaccine</th><th>Date</th><th>Next Due</th><th>Vet</th></tr></thead>
                      <tbody>
                        {pet.vaccinations.map((v, i) => (
                          <tr key={i}>
                            <td className="font-medium">{v.vaccineName}</td>
                            <td>{formatDate(v.date)}</td>
                            <td>{formatDate(v.nextDueDate)}</td>
                            <td>{v.veterinarian || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'Consultations' && (
            consultations.length === 0 ? (
              <p className="text-slate-400 text-sm">No consultations recorded.</p>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead><tr><th>Date</th><th>Doctor</th><th>Symptoms</th><th>Diagnosis</th><th>Status</th></tr></thead>
                  <tbody>
                    {consultations.map((c) => (
                      <tr key={c._id}>
                        <td>{formatDate(c.visitDate)}</td>
                        <td>{c.doctor || '—'}</td>
                        <td className="max-w-xs truncate">{c.symptoms || '—'}</td>
                        <td className="max-w-xs truncate">{c.diagnosis || '—'}</td>
                        <td><span className={`badge ${c.status === 'COMPLETED' ? 'badge-green' : 'badge-yellow'}`}>{c.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {tab === 'Prescriptions' && (
            prescriptions.length === 0 ? (
              <p className="text-slate-400 text-sm">No prescriptions found.</p>
            ) : (
              <div className="space-y-3">
                {prescriptions.map((rx) => (
                  <div key={rx._id} className="border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="badge badge-blue font-mono">{rx.prescriptionNumber}</span>
                      <span className="text-xs text-slate-500">{formatDate(rx.createdAt)}</span>
                    </div>
                    <div className="space-y-2">
                      {rx.items?.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <span className="font-medium">{item.medicineName}</span>
                          {item.dosage && <span className="badge badge-slate">{item.dosage}</span>}
                          {item.frequency && <span className="text-slate-500">{item.frequency}</span>}
                          {item.duration && <span className="text-slate-500">for {item.duration}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
