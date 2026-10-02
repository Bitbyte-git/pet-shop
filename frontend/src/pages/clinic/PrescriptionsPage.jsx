import { useState, useEffect, useCallback } from 'react';
import { prescriptionAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import { formatDate } from '../../utils/helpers';
import { EyeIcon } from '@heroicons/react/24/outline';

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [viewModal, setViewModal] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const r = await prescriptionAPI.getAll({ page, limit: 15 });
      setPrescriptions(r.data.prescriptions || []);
      setTotal(r.data.total || 0);
    } catch {}
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]);

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div><h1 className="page-title">Prescriptions</h1><p className="page-subtitle">All prescription records</p></div>
      </div>

      <div className="card">
        {loading ? <LoadingSpinner /> : (
          <>
            <div className="table-container">
              <table className="table">
                <thead><tr><th>Rx Number</th><th>Client</th><th>Pet</th><th>Doctor</th><th>Items</th><th>Valid Until</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {prescriptions.map((rx) => (
                    <tr key={rx._id}>
                      <td><span className="badge badge-blue font-mono">{rx.prescriptionNumber}</span></td>
                      <td>{rx.client?.name}</td>
                      <td>{rx.pet?.name}</td>
                      <td>{rx.doctor || '—'}</td>
                      <td>{rx.items?.length || 0} medicines</td>
                      <td>{formatDate(rx.validUntil)}</td>
                      <td><span className={`badge ${rx.status === 'ACTIVE' ? 'badge-green' : 'badge-slate'}`}>{rx.status}</span></td>
                      <td><button onClick={() => setViewModal(rx)} className="btn btn-secondary btn-sm"><EyeIcon className="h-3.5 w-3.5" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} total={total} limit={15} onPageChange={setPage} />
          </>
        )}
      </div>

      <Modal isOpen={!!viewModal} onClose={() => setViewModal(null)} title={`Prescription: ${viewModal?.prescriptionNumber}`} size="lg">
        {viewModal && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><span className="text-slate-500">Client:</span> <span className="font-medium">{viewModal.client?.name}</span></div>
              <div><span className="text-slate-500">Pet:</span> <span className="font-medium">{viewModal.pet?.name}</span></div>
              <div><span className="text-slate-500">Doctor:</span> {viewModal.doctor || '—'}</div>
              <div><span className="text-slate-500">Valid Until:</span> {formatDate(viewModal.validUntil)}</div>
            </div>
            <div>
              <p className="font-semibold text-slate-700 mb-2">Medicines</p>
              {viewModal.items?.map((item, i) => (
                <div key={i} className="border border-slate-200 rounded-lg p-3 mb-2">
                  <p className="font-medium text-slate-800">{item.medicineName}</p>
                  <div className="flex gap-4 mt-1 text-slate-500">
                    {item.dosage && <span>Dosage: {item.dosage}</span>}
                    {item.frequency && <span>Frequency: {item.frequency}</span>}
                    {item.duration && <span>Duration: {item.duration}</span>}
                  </div>
                  {item.instructions && <p className="text-slate-400 text-xs mt-1">{item.instructions}</p>}
                </div>
              ))}
            </div>
            {viewModal.notes && <div><p className="font-medium text-slate-700 mb-1">Notes:</p><p className="text-slate-600">{viewModal.notes}</p></div>}
          </div>
        )}
      </Modal>
    </div>
  );
}
