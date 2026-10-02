import { useState, useEffect, useCallback } from 'react';
import { productAPI, categoryAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import SearchInput from '../../components/common/SearchInput';
import Pagination from '../../components/common/Pagination';
import { formatCurrency, getStockStatusBadge, getExpiryStatusBadge } from '../../utils/helpers';

export default function BMProductsPage() {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState([]);
  const [catFilter, setCatFilter] = useState('');

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const r = await productAPI.getAll({ search, page, limit: 15, category: catFilter });
      setProducts(r.data.products || []);
      setTotal(r.data.total || 0);
    } catch {}
    finally { setLoading(false); }
  }, [search, page, catFilter]);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { setPage(1); }, [search, catFilter]);
  useEffect(() => { categoryAPI.getAll().then((r) => setCategories(r.data.categories)); }, []);

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div><h1 className="page-title">Products</h1><p className="page-subtitle">Available products for billing</p></div>
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
                <thead><tr><th>Code</th><th>Product</th><th>Category</th><th>Price</th><th>GST</th><th>Stock</th><th>Expiry</th></tr></thead>
                <tbody>
                  {products.map((p) => {
                    const s = getStockStatusBadge(p); const e = getExpiryStatusBadge(p.expiryDate);
                    return (
                      <tr key={p._id}>
                        <td><span className="font-mono text-xs badge badge-slate">{p.productCode}</span></td>
                        <td><p className="font-medium">{p.name}</p>{p.brand && <p className="text-xs text-slate-400">{p.brand}</p>}</td>
                        <td>{p.category?.name || '—'}</td>
                        <td className="text-money">{formatCurrency(p.sellingPrice)}</td>
                        <td>{p.gstRate}%</td>
                        <td><span className="font-bold">{p.currentStock}</span> <span className={`ml-1 badge ${s.class}`}>{s.label}</span></td>
                        <td><span className={`badge ${e.class}`}>{e.label}</span></td>
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
    </div>
  );
}
