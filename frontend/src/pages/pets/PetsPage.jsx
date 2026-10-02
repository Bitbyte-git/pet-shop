import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { petAPI, clientAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import SearchInput from '../../components/common/SearchInput';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import { formatDate, errorMessage } from '../../utils/helpers';
import { HeartIcon, EyeIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function PetsPage() {
  const [pets, setPets] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const fetchPets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await petAPI.getAll({ search, page, limit: 15 });
      setPets(res.data.pets);
      setTotal(res.data.total);
    } catch { toast.error('Failed to load pets.'); }
    finally { setLoading(false); }
  }, [search, page]);

  useEffect(() => { fetchPets(); }, [fetchPets]);
  useEffect(() => { setPage(1); }, [search]);

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pets</h1>
          <p className="page-subtitle">{total} pets registered</p>
        </div>
        <Link to="/admin/clients" className="btn btn-secondary">
          Add Pet via Client
        </Link>
      </div>

      <div className="card">
        <div className="card-header">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by pet name or ID..." className="max-w-sm" />
        </div>

        {loading ? <LoadingSpinner /> : (
          <>
            {pets.length === 0 ? (
              <EmptyState icon={HeartIcon} title="No pets found" description="Pets are added through client profiles." />
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead><tr>
                    <th>Pet ID</th><th>Name</th><th>Owner</th><th>Species</th>
                    <th>Breed</th><th>Gender</th><th>Date of Birth</th><th>Status</th><th>Actions</th>
                  </tr></thead>
                  <tbody>
                    {pets.map((p) => (
                      <tr key={p._id}>
                        <td><span className="badge badge-blue font-mono">{p.petId}</span></td>
                        <td className="font-medium text-slate-800">
                          <span className="mr-2">{p.species === 'Cat' ? '🐱' : p.species === 'Bird' ? '🐦' : '🐶'}</span>{p.name}
                        </td>
                        <td>
                          <Link to={`/admin/clients/${p.owner?._id}`} className="text-primary-600 hover:underline text-xs">
                            {p.owner?.name}
                          </Link>
                          <p className="text-xs text-slate-400">{p.owner?.clientId}</p>
                        </td>
                        <td>{p.species}</td>
                        <td>{p.breed || '—'}</td>
                        <td>{p.gender}</td>
                        <td className="text-slate-500 text-xs">{formatDate(p.dateOfBirth)}</td>
                        <td><span className={`badge ${p.status === 'ACTIVE' ? 'badge-green' : 'badge-red'}`}>{p.status}</span></td>
                        <td>
                          <Link to={`/admin/pets/${p._id}`} className="btn btn-secondary btn-sm">
                            <EyeIcon className="h-3.5 w-3.5" /> View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Pagination page={page} total={total} limit={15} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
