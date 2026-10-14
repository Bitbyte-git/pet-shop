import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDateTime } from '../../utils/helpers';
import SalesTrendChart from '../../components/charts/SalesTrendChart';
import SalesByCategoryChart from '../../components/charts/SalesByCategoryChart';
import StockByCategoryChart from '../../components/charts/StockByCategoryChart';
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

  const { stats, recentBills, lowStockAlerts, outOfStockAlerts, expiringProducts, expiredProducts, recentTransactions, salesAnalytics, analytics } = data;
  
  // Ensure analytics exists with defaults
  const analyticsData = analytics || {
    salesByCategory: [],
    stockByCategory: [],
  };

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

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-slate-800">7-Day Sales Trend</h3>
          </div>
          <div className="card-body">
            <SalesTrendChart data={salesAnalytics || []} />
          </div>
        </div>

        {/* Sales by Category */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-slate-800">Sales by Category (Today)</h3>
          </div>
          <div className="card-body">
            <SalesByCategoryChart data={analyticsData.salesByCategory} />
          </div>
        </div>

        {/* Stock by Category */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-slate-800">Stock Distribution by Category</h3>
          </div>
          <div className="card-body">
            <StockByCategoryChart data={analyticsData.stockByCategory} />
          </div>
        </div>
      </div>

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

        {/* Inventory Alerts */}
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <h3 className="font-semibold text-slate-800">📦 Inventory Alerts</h3>
            <Link to="/billing/inventory" className="text-xs text-primary-600 hover:underline font-medium">Manage Inventory</Link>
          </div>
          <div className="space-y-4 p-6">
            {/* Low Stock */}
            <div>
              <h4 className="text-sm font-semibold text-yellow-700 mb-2 flex items-center gap-2">
                <ExclamationTriangleIcon className="h-4 w-4" />
                Low Stock ({lowStockAlerts?.length || 0})
              </h4>
              <div className="space-y-2">
                {lowStockAlerts?.length === 0 ? (
                  <p className="text-xs text-green-600 font-medium">✓ All products have sufficient stock</p>
                ) : lowStockAlerts?.slice(0, 5).map((p) => (
                  <div key={p._id} className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{p.name}</p>
                      <p className="text-xs text-slate-500 font-mono">{p.productCode}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-yellow-700">{p.currentStock} left</p>
                      <p className="text-xs text-slate-500">Reorder at: {p.reorderLevel}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Out of Stock */}
            <div>
              <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
                <ExclamationTriangleIcon className="h-4 w-4" />
                Out of Stock ({outOfStockAlerts?.length || 0})
              </h4>
              <div className="space-y-2">
                {outOfStockAlerts?.length === 0 ? (
                  <p className="text-xs text-green-600 font-medium">✓ No products out of stock</p>
                ) : outOfStockAlerts?.slice(0, 5).map((p) => (
                  <div key={p._id} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{p.name}</p>
                      <p className="text-xs text-slate-500 font-mono">{p.productCode}</p>
                    </div>
                    <span className="badge badge-red">0 in stock</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Expiring Soon */}
            <div>
              <h4 className="text-sm font-semibold text-orange-700 mb-2 flex items-center gap-2">
                <ClockIcon className="h-4 w-4" />
                Expiring Soon ({expiringProducts?.length || 0})
              </h4>
              <div className="space-y-2">
                {expiringProducts?.length === 0 ? (
                  <p className="text-xs text-slate-500">No products expiring in next 90 days</p>
                ) : expiringProducts?.slice(0, 5).map((p) => (
                  <div key={p._id} className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{p.name}</p>
                      <p className="text-xs text-slate-500 font-mono">{p.productCode}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-orange-700">{p.daysUntilExpiry} days</p>
                      <p className="text-xs text-slate-500">Stock: {p.currentStock}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Expired */}
            <div>
              <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
                <ClockIcon className="h-4 w-4" />
                Expired ({expiredProducts?.length || 0})
              </h4>
              <div className="space-y-2">
                {expiredProducts?.length === 0 ? (
                  <p className="text-xs text-green-600 font-medium">✓ No expired products</p>
                ) : expiredProducts?.slice(0, 5).map((p) => (
                  <div key={p._id} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{p.name}</p>
                      <p className="text-xs text-slate-500 font-mono">{p.productCode}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-700">{p.daysExpired} days ago</p>
                      <p className="text-xs text-slate-500">Stock: {p.currentStock}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
