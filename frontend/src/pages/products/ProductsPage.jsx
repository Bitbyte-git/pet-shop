import { useState, useEffect, useCallback } from 'react';
import { productAPI, categoryAPI, supplierAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import SearchInput from '../../components/common/SearchInput';
import Pagination from '../../components/common/Pagination';
import { formatCurrency, formatDate, getStockStatusBadge, getExpiryStatusBadge, errorMessage } from '../../utils/helpers';
import { PlusIcon, PencilIcon, CubeIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const EMPTY = {
  name: '', productCode: '', category: '', brand: '', description: '', supplier: '',
  purchasePrice: '', sellingPrice: '', mrp: '', gstRate: '18', hsnCode: '',
  reorderLevel: '10', currentStock: '0', batchNumber: '',
  manufacturingDate: '', expiryDate: '', status: 'ACTIVE',
};

function ProductForm({ initial, categories, suppliers, onSubmit, loading, onClose }) {
  const [form, setForm] = useState(() => initial ? {
    ...EMPTY, ...initial,
    category: initial.category?._id || initial.category || '',
    supplier: initial.supplier?._id || initial.supplier || '',
    purchasePrice: initial.purchasePrice || '',
    sellingPrice: initial.sellingPrice || '',
    mrp: initial.mrp || '',
    gstRate: initial.gstRate ?? '18',
    reorderLevel: initial.reorderLevel ?? '10',
    currentStock: initial.currentStock ?? '0',
    manufacturingDate: initial.manufacturingDate ? initial.manufacturingDate.split('T')[0] : '',
    expiryDate: initial.expiryDate ? initial.expiryDate.split('T')[0] : '',
  } : EMPTY);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div className="form-grid-3">
        <div className="md:col-span-2">
          <label className="label">Product Name *</label>
          <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} required placeholder="Antibiotic Tablet 500mg" />
        </div>
        <div>
          <label className="label">Product Code {!initial && <span className="text-slate-400 text-xs">(auto if blank)</span>}</label>
          <input className="input font-mono" value={form.productCode} onChange={(e) => set('productCode', e.target.value.toUpperCase())} placeholder="MED-000001" />
        </div>
        <div>
          <label className="label">Category *</label>
          <select className="input" value={form.category} onChange={(e) => set('category', e.target.value)} required>
            <option value="">Select category</option>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Brand</label>
          <input className="input" value={form.brand} onChange={(e) => set('brand', e.target.value)} />
        </div>
        <div>
          <label className="label">Supplier</label>
          <select className="input" value={form.supplier} onChange={(e) => set('supplier', e.target.value)}>
            <option value="">Select supplier</option>
            {suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Purchase Price (₹) *</label>
          <input className="input" type="number" min="0" step="0.01" value={form.purchasePrice} onChange={(e) => set('purchasePrice', e.target.value)} required />
        </div>
        <div>
          <label className="label">Selling Price (₹) *</label>
          <input className="input" type="number" min="0" step="0.01" value={form.sellingPrice} onChange={(e) => set('sellingPrice', e.target.value)} required />
        </div>
        <div>
          <label className="label">MRP (₹)</label>
          <input className="input" type="number" min="0" step="0.01" value={form.mrp} onChange={(e) => set('mrp', e.target.value)} />
        </div>
        <div>
          <label className="label">GST Rate (%)</label>
          <select className="input" value={form.gstRate} onChange={(e) => set('gstRate', e.target.value)}>
            {[0, 5, 12, 18, 28].map((r) => <option key={r} value={r}>{r}%</option>)}
          </select>
        </div>
        <div>
          <label className="label">HSN Code</label>
          <input className="input font-mono" value={form.hsnCode} onChange={(e) => set('hsnCode', e.target.value)} placeholder="3004" />
        </div>
        <div>
          <label className="label">Reorder Level</label>
          <input className="input" type="number" min="0" value={form.reorderLevel} onChange={(e) => set('reorderLevel', e.target.value)} />
        </div>
        {!initial && (
          <div>
            <label className="label">Opening Stock</label>
            <input className="input" type="number" min="0" value={form.currentStock} onChange={(e) => set('currentStock', e.target.value)} />
          </div>
        )}
        <div>
          <label className="label">Batch Number</label>
          <input className="input font-mono" value={form.batchNumber} onChange={(e) => set('batchNumber', e.target.value)} />
        </div>
        <div>
          <label className="label">Mfg Date</label>
          <input className="input" type="date" value={form.manufacturingDate} onChange={(e) => set('manufacturingDate', e.target.value)} />
        </div>
        <div>
          <label className="label">Expiry Date</label>
          <input className="input" type="date" value={form.expiryDate} onChange={(e) => set('expiryDate', e.target.value)} />
        </div>
        <div className="md:col-span-3">
          <label className="label">Description</label>
          <textarea className="input resize-none" rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} />
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={form.status} onChange={(e) => set('status', e.target.value)}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving...' : (initial?._id ? 'Update Product' : 'Create Product')}
        </button>
      </div>
    </form>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productAPI.getAll({ search, page, limit: 15, category: categoryFilter, status: '' });
      setProducts(res.data.products);
      setTotal(res.data.total);
    } catch { toast.error('Failed to load products.'); }
    finally { setLoading(false); }
  }, [search, page, categoryFilter]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { setPage(1); }, [search, categoryFilter]);
  useEffect(() => {
    categoryAPI.getAll().then((r) => setCategories(r.data.categories));
    supplierAPI.getAll().then((r) => setSuppliers(r.data.suppliers));
  }, []);

  const handleCreate = async (form) => {
    setSaving(true);
    try {
      await productAPI.create(form);
      toast.success('Product created.');
      setModal(null);
      fetchProducts();
    } catch (err) { toast.error(errorMessage(err)); }
    finally { setSaving(false); }
  };

  const handleUpdate = async (form) => {
    setSaving(true);
    try {
      await productAPI.update(modal._id, form);
      toast.success('Product updated.');
      setModal(null);
      fetchProducts();
    } catch (err) { toast.error(errorMessage(err)); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">{total} products</p>
        </div>
        <button onClick={() => setModal('create')} className="btn-primary">
          <PlusIcon className="h-4 w-4" /> Add Product
        </button>
      </div>

      <div className="card">
        <div className="card-header flex flex-wrap gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name or code..." className="flex-1 min-w-48" />
          <select className="input w-48" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
        {loading ? <LoadingSpinner /> : (
          <>
            <div className="table-container">
              <table className="table">
                <thead><tr>
                  <th>Code</th><th>Product</th><th>Category</th><th>Sell Price</th>
                  <th>GST</th><th>Stock</th><th>Expiry</th><th>Status</th><th>Actions</th>
                </tr></thead>
                <tbody>
                  {products.map((p) => {
                    const stockBadge = getStockStatusBadge(p);
                    const expiryBadge = getExpiryStatusBadge(p.expiryDate);
                    return (
                      <tr key={p._id}>
                        <td><span className="font-mono text-xs badge badge-slate">{p.productCode}</span></td>
                        <td>
                          <p className="font-medium text-slate-800">{p.name}</p>
                          {p.brand && <p className="text-xs text-slate-400">{p.brand}</p>}
                        </td>
                        <td>{p.category?.name || '—'}</td>
                        <td className="text-money">{formatCurrency(p.sellingPrice)}</td>
                        <td>{p.gstRate}%</td>
                        <td>
                          <span className="font-semibold text-slate-700">{p.currentStock}</span>
                          <span className={`ml-2 badge ${stockBadge.class}`}>{stockBadge.label}</span>
                        </td>
                        <td><span className={`badge ${expiryBadge.class}`}>{expiryBadge.label}</span></td>
                        <td><span className={`badge ${p.status === 'ACTIVE' ? 'badge-green' : 'badge-red'}`}>{p.status}</span></td>
                        <td>
                          <button onClick={() => setModal(p)} className="btn btn-secondary btn-sm">
                            <PencilIcon className="h-3.5 w-3.5" />
                          </button>
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

      <Modal isOpen={modal === 'create'} onClose={() => setModal(null)} title="Add New Product" size="xl">
        <ProductForm categories={categories} suppliers={suppliers} onSubmit={handleCreate} loading={saving} onClose={() => setModal(null)} />
      </Modal>
      <Modal isOpen={modal && modal !== 'create'} onClose={() => setModal(null)} title="Edit Product" size="xl">
        {modal && modal !== 'create' && (
          <ProductForm initial={modal} categories={categories} suppliers={suppliers} onSubmit={handleUpdate} loading={saving} onClose={() => setModal(null)} />
        )}
      </Modal>
    </div>
  );
}
