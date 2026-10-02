import { useState, useEffect, useCallback } from 'react';
import { inventoryAPI, categoryAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import SearchInput from '../../components/common/SearchInput';
import Pagination from '../../components/common/Pagination';
import { formatCurrency, formatDate, getStockStatusBadge, getExpiryStatusBadge, errorMessage } from '../../utils/helpers';
import { AdjustmentsHorizontalIcon, ClockIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { inventoryAPI as invAPI } from '../../services/api';

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState([]);
  const [catFilter, setCatFilter] = useState('');
  const [adjustModal, setAdjustModal] = useState(null);
  const [historyModal, setHistoryModal] = useState(null);
  const [adjustForm, setAdjustForm] = useState({ quantity: '', reason: '' });
  const [adjusting, setAdjusting] = useState(false);
  const [history, setHistory] = useState([]);
  const [histLoading, setHistLoading] = useState(false);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await inventoryAPI.getAll({ search, page, limit: 15, category: catFilter });
      setProducts(res.data.products || []);
      setTotal(res.data.total || 0);
    } catch { toast.error('Failed to load inventory.'); }
    finally { setLoading(false); }
  }, [search, page, catFilter]);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);
  useEffect(() => { setPage(1); }, [search, catFilter]);
  useEffect(() => {
    categoryAPI.getAll().then((r) => setCategories(r.data.categories));
  }, []);

  const openHistory = async (product) => {
    setHistoryModal(product);
    setHistLoading(true);
    try {
      const res = await inventoryAPI.getHistory(product._id);
      setHistory(res.data.transactions || []);
    } catch {}
    finally { setHistLoading(false); }
  };

  const handleAdjust = async (e) => {
    e.preventDefault();
    if (!adjustForm.quantity) return toast.error('Enter quantity.');
    setAdjusting(true);
    try {
      await inventoryAPI.adjust({ productId: adjustModal._id, quantity: Number(adjustForm.quantity), reason: adjustForm.reason });
      toast.success('Stock adjusted successfully.');
      setAdjustModal(null);
      setAdjustForm({ quantity: '', reason: '' });
      fetchInventory();
    } catch (err) { toast.error(errorMessage(err)); }
    finally { setAdjusting(false); }
  };

  // Stats
  const outOfStock = products.filter((p) => p.currentStock === 0).length;
  const lowStock = products.filter((p) => p.currentStock > 0 && p.currentStock <= p.reorderLevel).length;
  const now = new Date();
  const expiring = products.filter((p) => p.expiryDate && new Date(p.expiryDate) > now && Math.ceil((new Date(p.expiryDate) - now) / 86400000) <= 90).length;
  const expired = products.filter((p) => p.expiryDate && new Date(p.expiryDate) < now).length;

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="page-subtitle">Stock levels and movement tracking</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Out of Stock', value: outOfStock, color: 'bg-red-50 border-red-200 text-red-700' },
          { label: 'Low Stock', value: lowStock, color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
          { label: 'Expiring Soon', value: expiring, color: 'bg-orange-50 border-orange-200 text-orange-700' },
          { label: 'Expired', value: expired, color: 'bg-red-50 border-red-300 text-red-800' },
        ].map((s) => (
          <div key={s.label} className={`card p-4 border ${s.color}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-sm font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header flex flex-wrap gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search products..." className="flex-1 min-w-48" />
          <select className="input w-48" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>

        {loading ? <LoadingSpinner /> : (
          <>
            <div className="table-container">
              <table className="table">
                <thead><tr>
                  <th>Code</th><th>Product</th><th>Category</th><th>Stock</th>
                  <th>Reorder</th><th>Batch</th><th>Expiry</th><th>Status</th><th>Actions</th>
                </tr></thead>
                <tbody>
                  {products.map((p) => {
                    const stock = getStockStatusBadge(p);
                    const expiry = getExpiryStatusBadge(p.expiryDate);
                    return (
                      <tr key={p._id}>
                        <td><span className="font-mono text-xs badge badge-slate">{p.productCode}</span></td>
                        <td>
                          <p className="font-medium text-slate-800">{p.name}</p>
                          {p.brand && <p className="text-xs text-slate-400">{p.brand}</p>}
                        </td>
                        <td>{p.category?.name || '—'}</td>
                        <td>
                          <span className="text-lg font-bold text-slate-800">{p.currentStock}</span>
                          <span className={`ml-2 badge ${stock.class}`}>{stock.label}</span>
                        </td>
                        <td className="text-slate-500">{p.reorderLevel}</td>
                        <td><span className="font-mono text-xs">{p.batchNumber || '—'}</span></td>
                        <td>
                          <div>
                            <p className="text-xs">{formatDate(p.expiryDate)}</p>
                            <span className={`badge ${expiry.class}`}>{expiry.label}</span>
                          </div>
                        </td>
                        <td><span className={`badge ${p.status === 'ACTIVE' ? 'badge-green' : 'badge-red'}`}>{p.status}</span></td>
                        <td>
                          <div className="flex gap-2">
                            <button onClick={() => { setAdjustModal(p); setAdjustForm({ quantity: '', reason: '' }); }} className="btn btn-secondary btn-sm">
                              <AdjustmentsHorizontalIcon className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => openHistory(p)} className="btn btn-secondary btn-sm">
                              <ClockIcon className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={page} total={total} limit={15} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Adjust modal */}
      <Modal isOpen={!!adjustModal} onClose={() => setAdjustModal(null)} title={`Adjust Stock: ${adjustModal?.name}`} size="sm">
        {adjustModal && (
          <form onSubmit={handleAdjust} className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg text-sm">
              <p className="text-slate-600">Current stock: <span className="font-bold text-slate-800">{adjustModal.currentStock}</span></p>
            </div>
            <div>
              <label className="label">Adjustment Quantity</label>
              <p className="text-xs text-slate-400 mb-1">Use positive number to add, negative to subtract</p>
              <input className="input" type="number" value={adjustForm.quantity} onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })} placeholder="+10 or -5" required />
            </div>
            <div>
              <label className="label">Reason *</label>
              <input className="input" value={adjustForm.reason} onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })} placeholder="Damage, Return, Correction..." required />
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setAdjustModal(null)} className="btn btn-secondary">Cancel</button>
              <button type="submit" disabled={adjusting} className="btn-primary">{adjusting ? 'Adjusting...' : 'Adjust Stock'}</button>
            </div>
          </form>
        )}
      </Modal>

      {/* History modal */}
      <Modal isOpen={!!historyModal} onClose={() => setHistoryModal(null)} title={`Stock History: ${historyModal?.name}`} size="lg">
        {histLoading ? <LoadingSpinner /> : (
          <div className="table-container max-h-96 overflow-y-auto">
            <table className="table">
              <thead><tr><th>Type</th><th>Qty</th><th>Before</th><th>After</th><th>Reference</th><th>By</th><th>Date</th></tr></thead>
              <tbody>
                {history.length === 0 ? (
                  <tr><td colSpan={7} className="text-center text-slate-400 py-6">No transactions yet.</td></tr>
                ) : history.map((t) => (
                  <tr key={t._id}>
                    <td><span className={`badge ${t.type === 'PURCHASE' ? 'badge-green' : t.type === 'SALE' ? 'badge-blue' : t.type === 'CLINIC_USAGE' ? 'badge-orange' : 'badge-slate'}`}>{t.type}</span></td>
                    <td className={`font-bold ${t.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>{t.quantity > 0 ? '+' : ''}{t.quantity}</td>
                    <td>{t.previousStock}</td>
                    <td className="font-semibold">{t.newStock}</td>
                    <td className="font-mono text-xs">{t.referenceNumber || '—'}</td>
                    <td>{t.performedBy?.name || t.performedByName || '—'}</td>
                    <td className="text-xs text-slate-500">{formatDate(t.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
}
