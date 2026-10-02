import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { clientAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import SearchInput from '../../components/common/SearchInput';
import Pagination from '../../components/common/Pagination';
import { formatDateTime } from '../../utils/helpers';

export default function BMCustomersPage() {
  const [clients, setClients] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const r = await clientAPI.getAll({ search, page, limit: 15 });
      setClients(r.data.clients || []);
      setTotal(r.data.total || 0);
    } catch {}
    finally { setLoading(false); }
  }, [search, page]);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { setPage(1); }, [search]);

  return (
    <div className="space-y-5">
      <div className="page-header">
        <h1 className="page-title">Customers / Patients</h1>
      </div>
      <div className="card">
        <div className="card-header">
          <SearchInput value={search} onChange={setSearch} placeholder="Search customers..." className="max-w-sm" />
        </div>
        {loading ? <LoadingSpinner /> : (
          <>
            <div className="table-container">
              <table className="table">
                <thead><tr><th>Client ID</th><th>Name</th><th>Mobile</th><th>City</th><th>Pets</th><th>Joined</th></tr></thead>
                <tbody>
                  {clients.map((c) => (
                    <tr key={c._id}>
                      <td><span className="badge badge-blue font-mono">{c.clientId}</span></td>
                      <td className="font-medium">{c.name}</td>
                      <td>{c.mobile}</td>
                      <td>{c.city || '—'}</td>
                      <td><span className="badge badge-slate">{c.petCount || 0}</span></td>
                      <td className="text-xs text-slate-500">{formatDateTime(c.createdAt)}</td>
                    </tr>
                  ))}
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
