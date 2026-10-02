import { useState, useEffect, useCallback } from 'react';
import { purchaseAPI, supplierAPI, productAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import { formatCurrency, formatDate, formatDateTime, errorMessage } from '../../utils/helpers';
import { PlusIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const EMPTY_ITEM = { productId: '', productName: '', quantity: 1, purchasePrice: '', batchNumber: '', expiryDate: '' };

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(false);
  const [viewModal, setViewModal] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    supplierId: '', supplierName: '', invoiceNumber: '', purchaseDate: '', notes: '', items: [{ ...EMPTY_ITEM }]
  });

  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    try {
      const res = await purchaseAPI.getAll({ page, limit: 15 });
      setPurchases(res.data.purchases || []);
      setTotal(res.data.total || 0);
    } catch {}
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchPurchases(); }, [fetchPurchases]);
  useEffect(() => { supplierAPI.getAll().then((r) => setSuppliers(r.data.suppliers)); }, []);

  useEffect(() => {
    if (productSearch.length < 2) { setProductResults([]); return; }
    const t = setTimeout(() => {
      productAPI.search(productSearch).then((r) => setProductResults(r.data.products || []));
    }, 300);
    return () => clearTimeout(t);
  }, [productSearch]);

  const addItem = () => setForm((f) => ({ ...f, items: [...f.items, { ...EMPTY_ITEM }] }));
  const removeItem = (i) => setForm((f) => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i, key, val) => setForm((f) => {
    const items = [...f.items];
    items[i] = { ...items[i], [key]: val };
    return { ...f, items };
  });

  const selectProduct = (i, product) => {
    updateItem(i, 'productId', product._id);
    updateItem(i, 'productName', product.name);
    updateItem(i, 'purchasePrice', product.purchasePrice || '');
    setProductSearch('');
    setProductResults([]);
  };

  const total_amount = form.items.reduce((s, i) => s + (Number(i.quantity || 0) * Number(i.purchasePrice || 0)), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validItems = form.items.filter((i) => i.productId && i.quantity > 0 && i.purchasePrice > 0);
    if (validItems.length === 0) return toast.error('Add at least one valid product.');
    setSaving(true);
    try {
      await purchaseAPI.create({ ...form, items: validItems });
      toast.success('Purchase created and stock updated.');
      setModal(false);
      fetchPurchases();
    } catch (err) { toast.error(errorMessage(err)); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Purchases</h1>
          <p className="page-subtitle">Stock purchase history</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary">
          <PlusIcon className="h-4 w-4" /> Create Purchase
        </button>
      </div>

      <div className="card">
        {loading ? <LoadingSpinner /> : (
          <>
            <div className="table-container">
              <table className="table">
                <thead><tr>
                  <th>PO Number</th><th>Supplier</th><th>Items</th><th>Total</th><th>Date</th><th>By</th><th>Actions</th>
                </tr></thead>
                <tbody>
                  {purchases.map((p) => (
                    <tr key={p._id}>
                      <td><span className="badge badge-blue font-mono">{p.purchaseNumber}</span></td>
                      <td>{p.supplierName || p.supplier?.name || '—'}</td>
                      <td>{p.items?.length || 0} items</td>
                      <td className="text-money">{formatCurrency(p.totalAmount)}</td>
                      <td>{formatDate(p.purchaseDate || p.createdAt)}</td>
                      <td>{p.createdBy?.name || '—'}</td>
                      <td>
                        <button onClick={() => setViewModal(p)} className="btn btn-secondary btn-sm">
                          <EyeIcon className="h-3.5 w-3.5" /> View
                        </button>
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

      {/* Create Purchase Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Create Purchase Order" size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-grid">
            <div>
              <label className="label">Supplier</label>
              <select className="input" value={form.supplierId} onChange={(e) => {
                const s = suppliers.find((x) => x._id === e.target.value);
                setForm({ ...form, supplierId: e.target.value, supplierName: s?.name || '' });
              }}>
                <option value="">Select supplier</option>
                {suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Supplier Invoice Number</label>
              <input className="input" value={form.invoiceNumber} onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })} />
            </div>
            <div>
              <label className="label">Purchase Date</label>
              <input className="input" type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} />
            </div>
            <div>
              <label className="label">Notes</label>
              <input className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-700">Products</h3>
              <button type="button" onClick={addItem} className="btn btn-secondary btn-sm">
                <PlusIcon className="h-3.5 w-3.5" /> Add Row
              </button>
            </div>

            {/* Product search */}
            <div className="relative mb-3">
              <input className="input" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Search product to add..." />
              {productResults.length > 0 && (
                <div className="absolute z-10 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {productResults.map((p, i) => (
                    <button key={p._id} type="button" onClick={() => {
                      // Add to last empty item or new row
                      const lastEmpty = form.items.findIndex((it) => !it.productId);
                      if (lastEmpty >= 0) selectProduct(lastEmpty, p);
                      else { addItem(); setTimeout(() => selectProduct(form.items.length, p), 0); }
                    }}
                      className="w-full flex justify-between px-4 py-2 hover:bg-slate-50 text-sm text-left">
                      <span className="font-medium">{p.name}</span>
                      <span className="text-slate-400 font-mono">{p.productCode}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              {form.items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4">
                    {i === 0 && <label className="label text-xs">Product</label>}
                    <input className="input text-sm" value={item.productName} readOnly placeholder="Select from search above" />
                  </div>
                  <div className="col-span-2">
                    {i === 0 && <label className="label text-xs">Qty *</label>}
                    <input className="input text-sm" type="number" min="1" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    {i === 0 && <label className="label text-xs">Price (₹) *</label>}
                    <input className="input text-sm" type="number" step="0.01" value={item.purchasePrice} onChange={(e) => updateItem(i, 'purchasePrice', e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    {i === 0 && <label className="label text-xs">Batch</label>}
                    <input className="input text-sm font-mono" value={item.batchNumber} onChange={(e) => updateItem(i, 'batchNumber', e.target.value)} />
                  </div>
                  <div className="col-span-1">
                    {i === 0 && <label className="label text-xs">Expiry</label>}
                    <input className="input text-sm" type="date" value={item.expiryDate} onChange={(e) => updateItem(i, 'expiryDate', e.target.value)} />
                  </div>
                  <div className="col-span-1">
                    <button type="button" onClick={() => removeItem(i)} className="btn btn-danger btn-sm w-full">
                      <TrashIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <div className="bg-slate-50 border border-slate-200 rounded-xl px-6 py-3 text-sm">
                <span className="text-slate-500">Total Amount: </span>
                <span className="font-bold text-lg text-slate-800">{formatCurrency(total_amount)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t">
            <button type="button" onClick={() => setModal(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Creating...' : 'Create Purchase & Update Stock'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View modal */}
      <Modal isOpen={!!viewModal} onClose={() => setViewModal(null)} title={`Purchase: ${viewModal?.purchaseNumber}`} size="lg">
        {viewModal && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-slate-500">Supplier:</span> <span className="font-medium">{viewModal.supplierName || '—'}</span></div>
              <div><span className="text-slate-500">Date:</span> <span>{formatDate(viewModal.purchaseDate || viewModal.createdAt)}</span></div>
              <div><span className="text-slate-500">Invoice No:</span> <span className="font-mono">{viewModal.invoiceNumber || '—'}</span></div>
              <div><span className="text-slate-500">Total:</span> <span className="font-bold text-green-600">{formatCurrency(viewModal.totalAmount)}</span></div>
            </div>
            <div className="table-container">
              <table className="table">
                <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Batch</th><th>Expiry</th><th>Line Total</th></tr></thead>
                <tbody>
                  {viewModal.items?.map((it, i) => (
                    <tr key={i}>
                      <td className="font-medium">{it.productName}</td>
                      <td>{it.quantity}</td>
                      <td>{formatCurrency(it.purchasePrice)}</td>
                      <td className="font-mono text-xs">{it.batchNumber || '—'}</td>
                      <td>{formatDate(it.expiryDate)}</td>
                      <td className="font-semibold">{formatCurrency(it.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
