import { useState, useEffect } from 'react';
import { billingAPI, inventoryAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { ChartBarIcon } from '@heroicons/react/24/outline';

export default function ReportsPage() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    setLoading(true);
    billingAPI.getAll({ startDate, endDate, limit: 200 })
      .then((r) => setBills(r.data.bills || []))
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  const totalSales = bills.reduce((s, b) => s + (b.paymentStatus === 'PAID' ? b.grandTotal : 0), 0);
  const totalGST = bills.reduce((s, b) => s + (b.paymentStatus === 'PAID' ? b.gstAmount : 0), 0);
  const totalBills = bills.filter((b) => b.paymentStatus === 'PAID').length;

  const byMethod = bills.filter((b) => b.paymentStatus === 'PAID').reduce((acc, b) => {
    acc[b.paymentMethod] = (acc[b.paymentMethod] || 0) + b.grandTotal;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div><h1 className="page-title">Reports</h1><p className="page-subtitle">Sales summary and analytics</p></div>
      </div>

      {/* Date filter */}
      <div className="card card-body">
        <div className="flex gap-4 items-end">
          <div>
            <label className="label">From</label>
            <input className="input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="label">To</label>
            <input className="input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card card-body text-center">
              <p className="text-3xl font-bold text-primary-700">{totalBills}</p>
              <p className="text-sm text-slate-500 mt-1">Total Invoices (Paid)</p>
            </div>
            <div className="card card-body text-center">
              <p className="text-3xl font-bold text-green-600">{formatCurrency(totalSales)}</p>
              <p className="text-sm text-slate-500 mt-1">Total Sales Revenue</p>
            </div>
            <div className="card card-body text-center">
              <p className="text-3xl font-bold text-amber-600">{formatCurrency(totalGST)}</p>
              <p className="text-sm text-slate-500 mt-1">Total GST Collected</p>
            </div>
          </div>

          {/* By payment method */}
          <div className="card card-body">
            <h3 className="font-semibold text-slate-700 mb-4">Sales by Payment Method</h3>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(byMethod).map(([method, amount]) => (
                <div key={method} className="bg-slate-50 rounded-xl p-4 text-center">
                  <p className="text-xl font-bold text-slate-800">{formatCurrency(amount)}</p>
                  <p className="text-sm text-slate-500">{method}</p>
                </div>
              ))}
              {Object.keys(byMethod).length === 0 && <p className="text-slate-400 text-sm col-span-3">No data for this period.</p>}
            </div>
          </div>

          {/* Invoice list */}
          <div className="card">
            <div className="card-header"><h3 className="font-semibold text-slate-700">Invoice Summary</h3></div>
            <div className="table-container">
              <table className="table">
                <thead><tr><th>Invoice</th><th>Customer</th><th>Date</th><th>Subtotal</th><th>GST</th><th>Total</th><th>Method</th><th>Status</th></tr></thead>
                <tbody>
                  {bills.map((b) => (
                    <tr key={b._id}>
                      <td className="font-mono font-bold text-primary-700">{b.invoiceNumber}</td>
                      <td>{b.isWalkIn ? b.walkInName : b.clientNameSnapshot}</td>
                      <td className="text-xs text-slate-500">{formatDate(b.createdAt)}</td>
                      <td>{formatCurrency(b.subtotal)}</td>
                      <td>{formatCurrency(b.gstAmount)}</td>
                      <td className="font-bold">{formatCurrency(b.grandTotal)}</td>
                      <td><span className="badge badge-slate">{b.paymentMethod}</span></td>
                      <td><span className={`badge ${b.paymentStatus === 'PAID' ? 'badge-green' : 'badge-red'}`}>{b.paymentStatus}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
