import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { billingAPI, userAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import SearchInput from '../../components/common/SearchInput';
import Pagination from '../../components/common/Pagination';
import PrintInvoiceModal from '../../components/modals/PrintInvoiceModal';
import { formatCurrency, formatDateTime, getPaymentStatusBadge } from '../../utils/helpers';
import { EyeIcon, DocumentArrowDownIcon, PrinterIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

export default function BillingHistoryPage() {
  const { isAdmin } = useAuth();
  const location = useLocation();
  const basePath = isAdmin ? '/admin' : '/billing';

  const [selectedBillForPrint, setSelectedBillForPrint] = useState(null);

  const [bills, setBills] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [billTypeFilter, setBillTypeFilter] = useState(''); // '' | 'PRODUCT' | 'CLINIC'
  const [statusFilter, setStatusFilter] = useState('');
  const [bmFilter, setBmFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [billingManagers, setBillingManagers] = useState([]);

  // Load Billing Managers list for filter
  useEffect(() => {
    userAPI.getAll().then((res) => {
      const users = res.data.users || [];
      setBillingManagers(users.filter((u) => u.role === 'BILLING_MANAGER' || u.role === 'ADMIN'));
    }).catch(() => {});
  }, []);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        search,
        page,
        limit: 15,
        billType: billTypeFilter,
        paymentStatus: statusFilter,
        createdBy: bmFilter,
        startDate,
        endDate,
      };
      const res = await billingAPI.getHistory(params);
      setBills(res.data.bills || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, page, billTypeFilter, statusFilter, bmFilter, startDate, endDate]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);
  useEffect(() => { setPage(1); }, [search, billTypeFilter, statusFilter, bmFilter, startDate, endDate]);

  const handleDownloadPDF = (bill, e) => {
    e.stopPropagation();
    if (bill.billType === 'PRODUCT') {
      billingAPI.downloadPdf(bill._id, bill.billNumber);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setBillTypeFilter('');
    setStatusFilter('');
    setBmFilter('');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="space-y-5">
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Billing History</h1>
          <p className="page-subtitle">Combined view of Product Shop Invoices and Internal Clinic Records</p>
        </div>
        <div className="flex gap-2">
          <span className="badge badge-blue">Product Bills: GST</span>
          <span className="badge badge-amber">Clinic Bills: NO GST</span>
        </div>
      </div>

      <div className="card space-y-4 p-4">
        {/* Search & Main Filter Header */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search invoice no, client, pet..."
            className="lg:col-span-2"
          />

          {/* Billing Type Filter */}
          <select className="input text-sm" value={billTypeFilter} onChange={(e) => setBillTypeFilter(e.target.value)}>
            <option value="">All Billing Types</option>
            <option value="PRODUCT">🛒 Product Bills (GST)</option>
            <option value="CLINIC">🩺 Clinic Bills (NO GST)</option>
          </select>

          {/* Payment Status Filter */}
          <select className="input text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Created By / Billing Manager Filter */}
          <select className="input text-sm" value={bmFilter} onChange={(e) => setBmFilter(e.target.value)}>
            <option value="">Created By (All Users)</option>
            {billingManagers.map((bm) => (
              <option key={bm._id} value={bm._id}>
                👤 {bm.name} ({bm.role})
              </option>
            ))}
          </select>

          <button onClick={resetFilters} className="btn btn-secondary text-xs">
            Reset Filters
          </button>
        </div>

        {/* Date Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600">
          <FunnelIcon className="h-4 w-4 text-slate-400" />
          <span className="font-semibold">Filter Date:</span>
          <div className="flex items-center gap-2">
            <span>From:</span>
            <input type="date" className="input text-xs py-1 px-2" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <span>To:</span>
            <input type="date" className="input text-xs py-1 px-2" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <span className="ml-auto font-medium text-slate-700">Total: {total} records found</span>
        </div>

        {loading ? <LoadingSpinner /> : (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Bill Number</th>
                    <th>Type</th>
                    <th>Customer</th>
                    <th>Pet</th>
                    <th>Amount</th>
                    <th>GST</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Created By</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.length === 0 ? (
                    <tr><td colSpan={11} className="text-center py-10 text-slate-400">No billing records match criteria.</td></tr>
                  ) : bills.map((b) => {
                    const isProduct = b.billType === 'PRODUCT';
                    return (
                      <tr key={b._id}>
                        <td>
                          <span className={`font-mono font-bold ${isProduct ? 'text-primary-700' : 'text-amber-800'}`}>
                            {b.billNumber}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${isProduct ? 'badge-blue' : 'badge-amber'}`}>
                            {isProduct ? 'PRODUCT' : 'CLINIC'}
                          </span>
                        </td>
                        <td>
                          <p className="font-medium text-slate-800">{b.clientName}</p>
                        </td>
                        <td>{b.petName}</td>
                        <td className="text-money font-bold">{formatCurrency(b.grandTotal)}</td>
                        <td>
                          {isProduct ? (
                            <span className="text-xs text-slate-600">{formatCurrency(b.gstAmount)}</span>
                          ) : (
                            <span className="badge badge-green text-xs">₹0 (No GST)</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${getPaymentStatusBadge(b.paymentStatus)}`}>
                            {b.paymentStatus}
                          </span>
                        </td>
                        <td>
                          <span className="badge badge-slate text-xs">{b.paymentMethod}</span>
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">
                              {(b.createdByName || b.createdBy?.name || 'U')?.[0]?.toUpperCase()}
                            </span>
                            <span className="text-xs font-medium text-slate-700">
                              {b.createdByName || b.createdBy?.name || 'Unknown'}
                            </span>
                          </div>
                        </td>
                        <td className="text-xs text-slate-500">{formatDateTime(b.createdAt)}</td>
                        <td>
                          <div className="flex gap-1">
                            {isProduct ? (
                              <>
                                <Link to={`${basePath}/billing/${b._id}`} className="btn btn-secondary btn-sm" title="View Details">
                                  <EyeIcon className="h-3.5 w-3.5" />
                                </Link>
                                <button onClick={() => setSelectedBillForPrint(b)} className="btn btn-secondary btn-sm" title="Print Invoice (A4 / Thermal)">
                                  <PrinterIcon className="h-3.5 w-3.5 text-slate-600" />
                                </button>
                                <button onClick={(e) => handleDownloadPDF(b, e)} className="btn btn-secondary btn-sm" title="Download Invoice PDF">
                                  <DocumentArrowDownIcon className="h-3.5 w-3.5" />
                                </button>
                              </>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Internal</span>
                            )}
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

      <PrintInvoiceModal
        isOpen={!!selectedBillForPrint}
        onClose={() => setSelectedBillForPrint(null)}
        bill={selectedBillForPrint}
      />
    </div>
  );
}
