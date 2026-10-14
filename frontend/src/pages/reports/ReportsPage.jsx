import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { billingAPI, inventoryAPI, clinicAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/helpers';
import SalesTrendChart from '../../components/charts/SalesTrendChart';
import {
  ChartBarIcon, CalendarIcon, FunnelIcon, ArrowDownTrayIcon,
  ShoppingBagIcon, BeakerIcon, CurrencyRupeeIcon, DocumentTextIcon,
  ExclamationTriangleIcon, ClockIcon, CubeIcon,
} from '@heroicons/react/24/outline';

export default function ReportsPage() {
  const { user } = useAuth();
  // Set default tab based on user role
  const defaultTab = user?.role === 'CLINIC_MANAGER' ? 'clinic' :
                    user?.role === 'BILLING_MANAGER' ? 'product' : 'combined';
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30); // Last 30 days by default
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [billType, setBillType] = useState('ALL');
  const [paymentStatus, setPaymentStatus] = useState('ALL');
  const [paymentMethod, setPaymentMethod] = useState('ALL');
  const [inventoryData, setInventoryData] = useState({
    lowStock: [],
    outOfStock: [],
    expiringSoon: [],
    expired: [],
  });

  useEffect(() => {
    setLoading(true);
    // Fetch data based on user role
    const fetchData = async () => {
      try {
        if (user?.role === 'CLINIC_MANAGER') {
          // Clinic Manager: Only fetch clinic billing data
          const clinicRes = await clinicAPI.getClinicBillings({
            startDate,
            endDate,
            limit: 500
          });
          setBills(clinicRes.data.bills || []);
        } else if (user?.role === 'BILLING_MANAGER') {
          // Billing Manager: Only fetch product billing data
          const billingRes = await billingAPI.getHistory({
            startDate,
            endDate,
            billType: 'PRODUCT',
            paymentStatus: paymentStatus === 'ALL' ? undefined : paymentStatus,
            paymentMethod: paymentMethod === 'ALL' ? undefined : paymentMethod,
            limit: 500
          });
          setBills(billingRes.data.bills || []);
          // Also fetch inventory for billing manager
          const [lowStockRes, expiringRes] = await Promise.all([
            inventoryAPI.getLowStock(),
            inventoryAPI.getExpiry(90),
          ]);
          const allProducts = [...(lowStockRes.data?.products || []), ...(expiringRes.data?.products || [])];
          const lowStock = allProducts.filter(p => p.currentStock <= p.reorderLevel && p.currentStock > 0);
          const outOfStock = allProducts.filter(p => p.currentStock === 0);
          const expiringSoon = allProducts.filter(p => p.expiryDate && new Date(p.expiryDate) <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) && new Date(p.expiryDate) >= new Date());
          const expired = allProducts.filter(p => p.expiryDate && new Date(p.expiryDate) < new Date());
          setInventoryData({ lowStock, outOfStock, expiringSoon, expired });
        } else {
          // Admin: Fetch all data
          const [billingRes, lowStockRes, expiringRes] = await Promise.all([
            billingAPI.getHistory({
              startDate,
              endDate,
              billType: billType === 'ALL' ? undefined : billType,
              paymentStatus: paymentStatus === 'ALL' ? undefined : paymentStatus,
              paymentMethod: paymentMethod === 'ALL' ? undefined : paymentMethod,
              limit: 500
            }),
            inventoryAPI.getLowStock(),
            inventoryAPI.getExpiry(90),
          ]);
          setBills(billingRes.data.bills || []);
          const allProducts = [...(lowStockRes.data?.products || []), ...(expiringRes.data?.products || [])];
          const lowStock = allProducts.filter(p => p.currentStock <= p.reorderLevel && p.currentStock > 0);
          const outOfStock = allProducts.filter(p => p.currentStock === 0);
          const expiringSoon = allProducts.filter(p => p.expiryDate && new Date(p.expiryDate) <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) && new Date(p.expiryDate) >= new Date());
          const expired = allProducts.filter(p => p.expiryDate && new Date(p.expiryDate) < new Date());
          setInventoryData({ lowStock, outOfStock, expiringSoon, expired });
        }
      } catch (err) {
        console.error('Error fetching reports data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate, billType, paymentStatus, paymentMethod, user?.role]);

  // Separate bills by type
  const productBills = bills.filter(b => b.billType === 'PRODUCT');
  const clinicBills = bills.filter(b => b.billType === 'CLINIC' || !b.billType);

  // Calculate stats for Product Shop
  const productStats = {
    totalBills: productBills.filter(b => b.paymentStatus === 'PAID').length,
    totalSales: productBills.reduce((s, b) => s + (b.paymentStatus === 'PAID' ? b.grandTotal : 0), 0),
    totalGST: productBills.reduce((s, b) => s + (b.paymentStatus === 'PAID' ? b.gstAmount : 0), 0),
    subtotal: productBills.reduce((s, b) => s + (b.paymentStatus === 'PAID' ? b.subtotal : 0), 0),
  };

  // Calculate stats for Clinic (no GST, always active)
  const clinicStats = {
    totalBills: clinicBills.length,
    totalSales: clinicBills.reduce((s, b) => s + (b.totalAmount || 0), 0),
    totalGST: 0,
    subtotal: clinicBills.reduce((s, b) => s + (b.totalAmount || 0), 0),
  };

  // Combined stats
  const combinedStats = {
    totalBills: productStats.totalBills + clinicStats.totalBills,
    totalSales: productStats.totalSales + clinicStats.totalSales,
    totalGST: productStats.totalGST,
    subtotal: productStats.subtotal + clinicStats.subtotal,
  };

  // Prepare chart data - only use filtered bills that match current filters
  const prepareSalesTrendData = (billsList) => {
    const trend = {};
    billsList.forEach(bill => {
      const date = new Date(bill.createdAt).toISOString().split('T')[0];
      const dayName = new Date(bill.createdAt).toLocaleDateString('en-US', { weekday: 'short' });
      if (!trend[date]) {
        trend[date] = { date, dayName, productSales: 0, clinicSales: 0, totalSales: 0 };
      }
      if (bill.billType === 'PRODUCT') {
        trend[date].productSales += bill.grandTotal;
      } else {
        trend[date].clinicSales += bill.totalAmount || bill.grandTotal || 0;
      }
      trend[date].totalSales += (bill.billType === 'PRODUCT' ? bill.grandTotal : bill.totalAmount || bill.grandTotal || 0);
    });
    return Object.values(trend).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-7);
  };

  // Use the current bills based on active tab
  const currentBillsForChart = activeTab === 'product' ? productBills :
                                activeTab === 'clinic' ? clinicBills : bills;
  const salesTrendData = prepareSalesTrendData(currentBillsForChart);

  const currentStats = activeTab === 'product' ? productStats :
                       activeTab === 'clinic' ? clinicStats : combinedStats;
  const currentBills = activeTab === 'product' ? productBills :
                      activeTab === 'clinic' ? clinicBills : bills;

  // Determine if user should see inventory section
  const showInventory = user?.role === 'ADMIN' || user?.role === 'BILLING_MANAGER';

  // Determine if user should see combined tab
  const showCombinedTab = user?.role === 'ADMIN';

  // Determine which tabs to show
  const showProductTab = user?.role === 'ADMIN' || user?.role === 'BILLING_MANAGER';
  const showClinicTab = user?.role === 'ADMIN' || user?.role === 'CLINIC_MANAGER';

  const resetFilters = () => {
    setBillType('ALL');
    setPaymentStatus('ALL');
    setPaymentMethod('ALL');
  };

  const exportToCSV = () => {
    // Helper to escape CSV values
    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    // Prepare CSV headers
    const headers = [
      'Bill Number',
      'Bill Type',
      'Customer Name',
      'Date',
      'Subtotal',
      'GST',
      'Total',
      'Payment Method',
      'Status',
    ];

    // Prepare CSV data
    const csvData = currentBills.map(bill => [
      bill.billNumber,
      bill.billType,
      bill.clientName,
      formatDate(bill.createdAt),
      bill.subtotal.toFixed(2),
      bill.gstAmount ? bill.gstAmount.toFixed(2) : '0.00',
      bill.grandTotal.toFixed(2),
      bill.paymentMethod,
      bill.paymentStatus,
    ].map(escapeCSV));

    // Combine headers and data
    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...csvData.map(row => row.join(',')),
    ].join('\n');

    // Add summary at the top
    const summary = [
      'PAWS & CARE - BILLING REPORT',
      '',
      'REPORT SUMMARY',
      `Date Range: ${startDate} to ${endDate}`,
      `Bill Type Filter: ${billType === 'ALL' ? 'All Types' : billType}`,
      `Payment Status: ${paymentStatus === 'ALL' ? 'All Status' : paymentStatus}`,
      `Payment Method: ${paymentMethod === 'ALL' ? 'All Methods' : paymentMethod}`,
      '',
      `Total Bills: ${currentStats.totalBills}`,
      `Total Revenue: ${currentStats.totalSales.toFixed(2)}`,
      `GST Collected: ${currentStats.totalGST.toFixed(2)}`,
      '',
      'BILL DETAILS',
      '',
    ].join('\n');

    // Create blob and download
    const blob = new Blob([summary + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `billing-report-${startDate}-to-${endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-subtitle">Comprehensive billing and revenue analysis</p>
        </div>
        <button onClick={exportToCSV} className="btn btn-secondary gap-2">
          <ArrowDownTrayIcon className="h-4 w-4" />
          Export Report
        </button>
      </div>

      {/* Filters */}
      <div className="card card-body">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="label flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              From Date
            </label>
            <input
              className="input"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="label flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              To Date
            </label>
            <input
              className="input"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          {showCombinedTab && (
            <div>
              <label className="label flex items-center gap-2">
                <FunnelIcon className="h-4 w-4" />
                Bill Type
              </label>
              <select
                className="input"
                value={billType}
                onChange={(e) => setBillType(e.target.value)}
              >
                <option value="ALL">All Types</option>
                <option value="PRODUCT">Product Shop</option>
                <option value="CLINIC">Clinic Billing</option>
              </select>
            </div>
          )}
          {showProductTab && (
            <div>
              <label className="label">Payment Status</label>
              <select
                className="input"
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
              >
                <option value="ALL">All Status</option>
                <option value="PAID">Paid</option>
                <option value="PENDING">Pending</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          )}
          {showProductTab && (
            <div>
              <label className="label">Payment Method</label>
              <select
                className="input"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="ALL">All Methods</option>
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="CARD">Card</option>
              </select>
            </div>
          )}
          <button onClick={resetFilters} className="btn btn-secondary">
            Reset Filters
          </button>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card card-body border-l-4 border-l-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Bills</p>
                  <p className="text-2xl font-bold text-slate-800">{currentStats.totalBills}</p>
                </div>
                <DocumentTextIcon className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            <div className="card card-body border-l-4 border-l-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(currentStats.totalSales)}</p>
                </div>
                <CurrencyRupeeIcon className="h-8 w-8 text-green-500" />
              </div>
            </div>
            {showProductTab && activeTab !== 'clinic' && (
              <div className="card card-body border-l-4 border-l-amber-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">GST Collected</p>
                    <p className="text-2xl font-bold text-amber-600">{formatCurrency(currentStats.totalGST)}</p>
                  </div>
                  <CurrencyRupeeIcon className="h-8 w-8 text-amber-500" />
                </div>
              </div>
            )}
            <div className="card card-body border-l-4 border-l-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Subtotal</p>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(currentStats.subtotal)}</p>
                </div>
                <CurrencyRupeeIcon className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          </div>

          {/* Revenue Comparison - Show for Admin only */}
          {showCombinedTab && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card card-body border-l-4 border-l-blue-500">
                <div className="flex items-center gap-3 mb-4">
                  <ShoppingBagIcon className="h-6 w-6 text-blue-500" />
                  <div>
                    <h3 className="font-semibold text-slate-800">Product Shop Revenue</h3>
                    <p className="text-sm text-slate-500">Customer invoices with GST</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Total Sales</span>
                    <span className="font-bold text-slate-800">{formatCurrency(productStats.totalSales)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">GST Collected</span>
                    <span className="font-bold text-amber-600">{formatCurrency(productStats.totalGST)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Number of Bills</span>
                    <span className="font-bold text-slate-800">{productStats.totalBills}</span>
                  </div>
                </div>
              </div>

              <div className="card card-body border-l-4 border-l-amber-500">
                <div className="flex items-center gap-3 mb-4">
                  <BeakerIcon className="h-6 w-6 text-amber-500" />
                  <div>
                    <h3 className="font-semibold text-slate-800">Clinic Billing Revenue</h3>
                    <p className="text-sm text-slate-500">Internal records (No GST)</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Total Sales</span>
                    <span className="font-bold text-slate-800">{formatCurrency(clinicStats.totalSales)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">GST</span>
                    <span className="font-bold text-slate-400">Not Applicable</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Number of Bills</span>
                    <span className="font-bold text-slate-800">{clinicStats.totalBills}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Inventory Alerts Section - Show for Admin and Billing Manager only */}
          {showInventory && (
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <CubeIcon className="h-5 w-5 text-primary-600" />
                  Inventory Alerts (Critical for Management)
                </h3>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Low Stock */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-yellow-700 flex items-center gap-2">
                      <ExclamationTriangleIcon className="h-4 w-4" />
                      Low Stock ({inventoryData.lowStock.length})
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {inventoryData.lowStock.length === 0 ? (
                        <p className="text-xs text-green-600 font-medium">✓ All products have sufficient stock</p>
                      ) : inventoryData.lowStock.slice(0, 5).map((p) => (
                        <div key={p._id} className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-slate-800">{p.name}</p>
                            <p className="text-xs text-slate-500 font-mono">{p.productCode}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-yellow-700">{p.currentStock} left</p>
                            <p className="text-xs text-slate-500">Reorder: {p.reorderLevel}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Out of Stock */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-red-700 flex items-center gap-2">
                      <ExclamationTriangleIcon className="h-4 w-4" />
                      Out of Stock ({inventoryData.outOfStock.length})
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {inventoryData.outOfStock.length === 0 ? (
                        <p className="text-xs text-green-600 font-medium">✓ No products out of stock</p>
                      ) : inventoryData.outOfStock.slice(0, 5).map((p) => (
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
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-orange-700 flex items-center gap-2">
                      <ClockIcon className="h-4 w-4" />
                      Expiring Soon ({inventoryData.expiringSoon.length})
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {inventoryData.expiringSoon.length === 0 ? (
                        <p className="text-xs text-slate-500">No products expiring in next 90 days</p>
                      ) : inventoryData.expiringSoon.slice(0, 5).map((p) => (
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
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-red-700 flex items-center gap-2">
                      <ClockIcon className="h-4 w-4" />
                      Expired ({inventoryData.expired.length})
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {inventoryData.expired.length === 0 ? (
                        <p className="text-xs text-green-600 font-medium">✓ No expired products</p>
                      ) : inventoryData.expired.slice(0, 5).map((p) => (
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
          )}

          {/* Sales Trend Chart */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-slate-800">Sales Trend (Last 7 Days)</h3>
            </div>
            <div className="card-body">
              <SalesTrendChart data={salesTrendData} />
            </div>
          </div>

          {/* Tabbed Bill List */}
          <div className="card">
            <div className="card-header">
              <div className="flex gap-2">
                {showCombinedTab && (
                  <button
                    onClick={() => setActiveTab('combined')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeTab === 'combined'
                        ? 'bg-primary-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All Bills
                  </button>
                )}
                {showProductTab && (
                  <button
                    onClick={() => setActiveTab('product')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeTab === 'product'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Product Shop
                  </button>
                )}
                {showClinicTab && (
                  <button
                    onClick={() => setActiveTab('clinic')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeTab === 'clinic'
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Clinic Billing
                  </button>
                )}
              </div>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Bill #</th>
                    {showCombinedTab && <th>Type</th>}
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Subtotal</th>
                    {showProductTab && <th>GST</th>}
                    <th>Total</th>
                    {showProductTab && <th>Method</th>}
                    {showProductTab && <th>Status</th>}
                  </tr>
                </thead>
                <tbody>
                  {currentBills.length === 0 ? (
                    <tr>
                      <td colSpan={showCombinedTab ? 9 : showProductTab ? 8 : 5} className="text-center py-8 text-slate-400">
                        No bills found for the selected filters
                      </td>
                    </tr>
                  ) : currentBills.map((b) => (
                    <tr key={b._id}>
                      <td className="font-mono font-bold text-primary-700">{b.billNumber || b.clinicBillId}</td>
                      {showCombinedTab && (
                        <td>
                          <span className={`badge text-xs ${b.billType === 'PRODUCT' ? 'badge-blue' : 'badge-amber'}`}>
                            {b.billType || 'CLINIC'}
                          </span>
                        </td>
                      )}
                      <td>{b.clientName}</td>
                      <td className="text-xs text-slate-500">{formatDate(b.createdAt)}</td>
                      <td>{formatCurrency(b.subtotal || b.totalAmount)}</td>
                      {showProductTab && (
                        <td className={b.billType === 'CLINIC' || !b.billType ? 'text-slate-400' : ''}>
                          {formatCurrency(b.gstAmount || 0)}
                        </td>
                      )}
                      <td className="font-bold">{formatCurrency(b.grandTotal || b.totalAmount)}</td>
                      {showProductTab && (
                        <td>
                          <span className="badge badge-slate">{b.paymentMethod || 'N/A'}</span>
                        </td>
                      )}
                      {showProductTab && (
                        <td>
                          <span className={`badge ${b.paymentStatus === 'PAID' ? 'badge-green' : 'badge-red'}`}>
                            {b.paymentStatus || 'ACTIVE'}
                          </span>
                        </td>
                      )}
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
