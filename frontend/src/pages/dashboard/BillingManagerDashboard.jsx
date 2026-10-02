import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDateTime } from '../../utils/helpers';
import {
  PlusCircleIcon, ReceiptRefundIcon, CurrencyRupeeIcon, ArrowTrendingUpIcon,
  UsersIcon, ShoppingBagIcon, ExclamationTriangleIcon, ClockIcon, BeakerIcon,
} from '@heroicons/react/24/outline';

export default function BillingManagerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getBillingManagerStats()
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!data) return null;

  const { stats, recentBills, lowStockAlerts, expiringProducts, recentTransactions, salesAnalytics } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Operational Billing Dashboard</h1>
          <p className="page-subtitle">Real-time business data, sales analytics, and inventory monitoring</p>
        </div>
        <Link to="/billing/new" className="btn btn-shop gap-2">
          <PlusCircleIcon className="h-5 w-5" />
          Create New Bill
        </Link>
      </div>

      {/* KPI Cards Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Today Sales */}
        <div className="stat-card">
          <div className="stat-icon bg-emerald-600">
            <ArrowTrendingUpIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="stat-value">{formatCurrency(stats.todaySales || 0)}</p>
            <p className="stat-label">Today's Total Sales</p>
          </div>
        </div>

        {/* Product Bills */}
        <div className="stat-card">
          <div className="stat-icon bg-blue-600">
            <ShoppingBagIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="stat-value">{stats.todayProductBills || 0} bills</p>
            <p className="stat-label">Product Sales: {formatCurrency(stats.todayProductSales || 0)}</p>
          </div>
        </div>

        {/* Clinic Bills */}
        <div className="stat-card">
          <div className="stat-icon bg-amber-600">
            <BeakerIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="stat-value">{stats.todayClinicBills || 0} bills</p>
            <p className="stat-label">Clinic Record: {formatCurrency(stats.todayClinicSales || 0)} (No GST)</p>
          </div>
        </div>

        {/* GST Collected */}
        <div className="stat-card">
          <div className="stat-icon bg-purple-600">
            <CurrencyRupeeIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="stat-value">{formatCurrency(stats.todayGST || 0)}</p>
            <p className="stat-label">GST Collected Today</p>
          </div>
        </div>
      </div>

      {/* Secondary Operational Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
            <UsersIcon className="h-5 w-5 text-slate-700" />
          </div>
          <div>
            <p className="text-xl font-bold text-slate-800">{stats.totalCustomers || 0}</p>
            <p className="text-xs text-slate-500">Total Customers</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
            <ShoppingBagIcon className="h-5 w-5 text-slate-700" />
          </div>
          <div>
            <p className="text-xl font-bold text-slate-800">{stats.totalProducts || 0}</p>
            <p className="text-xs text-slate-500">Total Products</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-700" />
          </div>
          <div>
            <p className="text-xl font-bold text-yellow-800">{stats.lowStockCount || 0}</p>
            <p className="text-xs text-yellow-600">Low Stock Alert</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
            <ClockIcon className="h-5 w-5 text-red-700" />
          </div>
          <div>
            <p className="text-xl font-bold text-red-800">{stats.expiringSoonCount || 0}</p>
            <p className="text-xs text-red-600">Expiring Soon (90 days)</p>
          </div>
        </div>
      </div>

      {/* Sales Analytics Chart/Breakdown */}
      {salesAnalytics && salesAnalytics.length > 0 && (
        <div className="card card-body">
          <h3 className="font-bold text-slate-800 mb-3">7-Day Sales Analytics</h3>
          <div className="grid grid-cols-7 gap-2 pt-2">
            {salesAnalytics.map((day, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center space-y-1">
                <p className="text-xs font-bold text-slate-600">{day.dayName}</p>
                <p className="text-xs text-slate-400">{day.date.slice(5)}</p>
                <p className="text-sm font-bold text-emerald-700 mt-1">{formatCurrency(day.totalSales)}</p>
                <p className="text-[10px] text-slate-500">{day.count} bills</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tables Row: Recent Bills & Inventory Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bills (Product + Clinic) */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Recent Bills (Product & Clinic)</h3>
            <Link to="/billing/history" className="text-xs text-primary-600 hover:underline">View History</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentBills?.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-sm">No billing records found.</div>
            ) : recentBills?.slice(0, 7).map((b) => (
              <div key={b._id} className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-800">{b.billNumber}</span>
                    <span className={`badge text-[10px] ${b.billType === 'PRODUCT' ? 'badge-blue' : 'badge-amber'}`}>
                      {b.billType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {b.clientName} · By: {b.createdByName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-800">{formatCurrency(b.grandTotal)}</p>
                  <span className={`badge text-[10px] ${b.paymentStatus === 'PAID' ? 'badge-green' : 'badge-yellow'}`}>
                    {b.paymentStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stock Alerts & Expiring Products */}
        <div className="space-y-4">
          <div className="card">
            <div className="card-header flex justify-between items-center">
              <h3 className="font-semibold text-slate-800">⚠️ Low Stock Alerts</h3>
              <Link to="/billing/inventory" className="text-xs text-primary-600 hover:underline font-medium">Manage Inventory</Link>
            </div>
            <div className="divide-y divide-slate-100">
              {lowStockAlerts?.length === 0 ? (
                <p className="text-xs text-green-600 text-center py-6 font-medium">✓ All products have sufficient stock</p>
              ) : lowStockAlerts?.map((p) => (
                <div key={p._id} className="flex items-center justify-between px-6 py-2.5 text-sm">
                  <div>
                    <p className="font-medium text-slate-800">{p.name}</p>
                    <p className="text-xs text-slate-400 font-mono">{p.productCode}</p>
                  </div>
                  <span className="badge badge-yellow">{p.currentStock} remaining</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header flex justify-between items-center">
              <h3 className="font-semibold text-slate-800">⏰ Expiring Products Tracking</h3>
              <Link to="/billing/products" className="text-xs text-primary-600 hover:underline font-medium">View Products</Link>
            </div>
            <div className="divide-y divide-slate-100">
              {expiringProducts?.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">No products expiring in next 90 days</p>
              ) : expiringProducts?.map((p) => (
                <div key={p._id} className="flex items-center justify-between px-6 py-2.5 text-sm">
                  <div>
                    <p className="font-medium text-slate-800">{p.name}</p>
                    <p className="text-xs text-slate-400 font-mono">{p.productCode}</p>
                  </div>
                  <span className="badge badge-red">{p.daysUntilExpiry} days left</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
