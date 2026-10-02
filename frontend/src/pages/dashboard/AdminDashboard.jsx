import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDateTime } from '../../utils/helpers';
import {
  UsersIcon, HeartIcon, CubeIcon, CurrencyRupeeIcon,
  ExclamationTriangleIcon, ReceiptRefundIcon, ArrowTrendingUpIcon,
  UserGroupIcon, ShieldCheckIcon, TruckIcon, BeakerIcon,
} from '@heroicons/react/24/outline';

function StatCard({ icon: Icon, iconBg, value, label, sub }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${iconBg}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div>
        <p className="stat-value">{value}</p>
        <p className="stat-label">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getAdminStats()
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!data) return null;

  const { stats, recentClients, recentBills, bmActivity, lowStockProducts, expiringSoonProducts } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Admin Management & Monitoring</h1>
          <p className="page-subtitle">Centralized oversight of all Billing Managers, Clinic Services, Product Sales, and Inventory</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/users" className="btn btn-primary gap-2">
            <UserGroupIcon className="h-4 w-4" /> Manage Billing Managers
          </Link>
          <Link to="/admin/billing" className="btn btn-secondary gap-2">
            <ReceiptRefundIcon className="h-4 w-4" /> Monitor Billing
          </Link>
        </div>
      </div>

      {/* Aggregate System Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={UsersIcon} iconBg="bg-blue-500" value={stats.totalClients} label="Total Customers" />
        <StatCard icon={HeartIcon} iconBg="bg-pink-500" value={stats.totalPets} label="Total Pets" />
        <StatCard icon={CubeIcon} iconBg="bg-violet-500" value={stats.totalProducts} label="Total Products" />
        <StatCard icon={CurrencyRupeeIcon} iconBg="bg-green-500" value={formatCurrency(stats.totalStockValue)} label="Total Stock Value" />
      </div>

      {/* Sales Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={ArrowTrendingUpIcon} iconBg="bg-emerald-600" value={formatCurrency(stats.todaySales)} label="Today's Gross Sales" sub="Product + Clinic Total" />
        <StatCard icon={ReceiptRefundIcon} iconBg="bg-blue-600" value={formatCurrency(stats.todayProductSales)} label="Product Shop Sales" sub="Customer invoices with GST" />
        <StatCard icon={BeakerIcon} iconBg="bg-amber-600" value={formatCurrency(stats.todayClinicSales)} label="Clinic Treatment Sales" sub="Internal records (NO GST)" />
      </div>

      {/* Billing Manager Activity Monitoring */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <UserGroupIcon className="h-5 w-5 text-primary-600" />
            Billing Managers Activity & Performance
          </h3>
          <Link to="/admin/users" className="text-xs text-primary-600 font-medium hover:underline">
            Manage Credentials & Accounts →
          </Link>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Billing Manager</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Total Bills Handled</th>
                <th>Sales Revenue Generated</th>
                <th>Account Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {bmActivity?.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-6 text-slate-400">No Billing Managers created yet.</td></tr>
              ) : bmActivity?.map((bm) => (
                <tr key={bm._id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-primary-700 font-bold text-xs">{bm.name?.[0]?.toUpperCase()}</span>
                      </div>
                      <span className="font-bold text-slate-800">{bm.name}</span>
                    </div>
                  </td>
                  <td>
                    <p className="text-xs">{bm.email}</p>
                    <p className="text-xs text-slate-400">{bm.phone || '—'}</p>
                  </td>
                  <td>
                    <span className={`badge ${bm.status === 'ACTIVE' ? 'badge-green' : 'badge-red'}`}>
                      {bm.status}
                    </span>
                  </td>
                  <td className="font-semibold">{bm.totalBills} bills</td>
                  <td className="text-money font-bold">{formatCurrency(bm.totalSales)}</td>
                  <td className="text-xs text-slate-500">{formatDateTime(bm.createdAt)}</td>
                  <td>
                    <Link to="/admin/users" className="btn btn-secondary btn-sm">Manage</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alerts Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/admin/inventory" className="card p-4 border-l-4 border-l-yellow-400 hover:shadow-md transition-shadow">
          <p className="text-2xl font-bold text-yellow-600">{stats.lowStockCount}</p>
          <p className="text-sm text-slate-500">Low Stock Products</p>
        </Link>
        <Link to="/admin/inventory" className="card p-4 border-l-4 border-l-red-400 hover:shadow-md transition-shadow">
          <p className="text-2xl font-bold text-red-600">{stats.outOfStockCount}</p>
          <p className="text-sm text-slate-500">Out of Stock</p>
        </Link>
        <Link to="/admin/inventory" className="card p-4 border-l-4 border-l-orange-400 hover:shadow-md transition-shadow">
          <p className="text-2xl font-bold text-orange-500">{stats.expiringSoonCount}</p>
          <p className="text-sm text-slate-500">Expiring Soon</p>
        </Link>
        <Link to="/admin/purchases" className="card p-4 border-l-4 border-l-blue-400 hover:shadow-md transition-shadow">
          <p className="text-2xl font-bold text-blue-600">{stats.totalPurchases || 0}</p>
          <p className="text-sm text-slate-500">Total Purchase Orders</p>
        </Link>
      </div>

      {/* Bottom Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bills Across All BMs */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">All Recent Transactions</h3>
            <Link to="/admin/billing" className="text-xs text-primary-600 hover:underline">Monitor All</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentBills?.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No transactions yet</p>
            ) : recentBills?.map((bill) => (
              <div key={bill._id} className="flex items-center justify-between px-6 py-3 hover:bg-slate-50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-800">{bill.billNumber}</span>
                    <span className={`badge text-[10px] ${bill.billType === 'PRODUCT' ? 'badge-blue' : 'badge-amber'}`}>
                      {bill.billType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {bill.clientName} · By: {bill.createdByName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-800">{formatCurrency(bill.grandTotal)}</p>
                  <span className={`badge text-[10px] ${bill.paymentStatus === 'PAID' ? 'badge-green' : 'badge-yellow'}`}>
                    {bill.paymentStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">⚠️ Stock & Expiry Alerts</h3>
            <Link to="/admin/inventory" className="text-xs text-primary-600 hover:underline">View inventory</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {lowStockProducts?.length === 0 ? (
              <p className="text-sm text-green-600 text-center py-8 font-medium">✓ All inventory levels normal</p>
            ) : lowStockProducts?.map((p) => (
              <div key={p._id} className="flex items-center justify-between px-6 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">{p.name}</p>
                  <p className="text-xs text-slate-400 font-mono">{p.productCode}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-yellow-600">{p.currentStock} remaining</p>
                  <p className="text-xs text-slate-400">Reorder at: {p.reorderLevel}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
