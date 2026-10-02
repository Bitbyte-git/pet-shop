import { useState, useEffect, useCallback } from 'react';
import { clinicAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import { formatDate, formatCurrency, errorMessage } from '../../utils/helpers';
import { EyeIcon } from '@heroicons/react/24/outline';

export default function TreatmentsPage() {
  const [treatments, setTreatments] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [viewModal, setViewModal] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const r = await clinicAPI.getTreatments({ page, limit: 15 });
      setTreatments(r.data.treatments || []);
      setTotal(r.data.total || 0);
    } catch {}
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]);

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div><h1 className="page-title">Treatments</h1><p className="page-subtitle">Treatment records linked to consultations</p></div>
      </div>

      <div className="card">
        {loading ? <LoadingSpinner /> : (
          <>
            <div className="table-container">
              <table className="table">
                <thead><tr><th>Treatment</th><th>Client</th><th>Pet</th><th>Products Used</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
                <tbody>
                  {treatments.map((t) => (
                    <tr key={t._id}>
                      <td className="font-medium">{t.treatmentName}</td>
                      <td>{t.client?.name}</td>
                      <td>{t.pet?.name}</td>
                      <td>{t.productsUsed?.length || 0} items</td>
                      <td><span className={`badge ${t.status === 'COMPLETED' ? 'badge-green' : 'badge-yellow'}`}>{t.status}</span></td>
                      <td>{formatDate(t.createdAt)}</td>
                      <td><button onClick={() => setViewModal(t)} className="btn btn-secondary btn-sm"><EyeIcon className="h-3.5 w-3.5" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} total={total} limit={15} onPageChange={setPage} />
          </>
        )}
      </div>

      <Modal isOpen={!!viewModal} onClose={() => setViewModal(null)} title="Treatment Details" size="lg">
        {viewModal && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><span className="text-slate-500">Treatment:</span> <span className="font-semibold">{viewModal.treatmentName}</span></div>
              <div><span className="text-slate-500">Status:</span> <span className={`badge ${viewModal.status === 'COMPLETED' ? 'badge-green' : 'badge-yellow'}`}>{viewModal.status}</span></div>
              <div><span className="text-slate-500">Client:</span> {viewModal.client?.name}</div>
              <div><span className="text-slate-500">Pet:</span> {viewModal.pet?.name}</div>
            </div>
            {viewModal.treatmentDetails && <div><p className="font-medium text-slate-700 mb-1">Details:</p><p className="text-slate-600">{viewModal.treatmentDetails}</p></div>}
            {viewModal.productsUsed?.length > 0 && (
              <div>
                <p className="font-semibold text-slate-700 mb-2">Products Used:</p>
                <div className="table-container">
                  <table className="table">
                    <thead><tr><th>Product</th><th>Qty</th><th>Unit Cost</th><th>Line Total</th></tr></thead>
                    <tbody>
                      {viewModal.productsUsed.map((p, i) => (
                        <tr key={i}>
                          <td>{p.productName}</td>
                          <td>{p.quantity}</td>
                          <td>{formatCurrency(p.unitCost)}</td>
                          <td className="font-semibold">{formatCurrency(p.lineTotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
