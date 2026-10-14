import { useState, useEffect } from 'react';
import { billingAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/helpers';
import SalesTrendChart from '../../components/charts/SalesTrendChart';
import {
  ChartBarIcon, CalendarIcon, FunnelIcon, ArrowDownTrayIcon,
  ShoppingBagIcon, BeakerIcon, CurrencyRupeeIcon, DocumentTextIcon,
} from '@heroicons/react/24/outline';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('combined');
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

  useEffect(() => {
    setLoading(true);
    billingAPI.getHistory({ 
      startDate, 
      endDate, 
      billType: billType === 'ALL' ? undefined : billType,
      paymentStatus: paymentStatus === 'ALL' ? undefined : paymentStatus,
      paymentMethod: paymentMethod === 'ALL' ? undefined : paymentMethod,
      limit: 500 
    })
      .then((r) => setBills(r.data.bills || []))
      .finally(() => setLoading(false));
  }, [startDate, endDate, billType, paymentStatus, paymentMethod]);

  // Separate bills by type
  const productBills = bills.filter(b => b.billType === 'PRODUCT');
  const clinicBills = bills.filter(b => b.billType === 'CLINIC');

  // Calculate stats for Product Shop
  const productStats = {
    totalBills: productBills.filter(b => b.paymentStatus === 'PAID').length,
    totalSales: productBills.reduce((s, b) => s + (b.paymentStatus === 'PAID' ? b.grandTotal : 0), 0),
    totalGST: productBills.reduce((s, b) => s + (b.paymentStatus === 'PAID' ? b.gstAmount : 0), 0),
    subtotal: productBills.reduce((s, b) => s + (b.paymentStatus === 'PAID' ? b.subtotal : 0), 0),
  };

  // Calculate stats for Clinic
  const clinicStats = {
    totalBills: clinicBills.filter(b => b.paymentStatus === 'PAID').length,
    totalSales: clinicBills.reduce((s, b) => s + (b.paymentStatus === 'PAID' ? b.grandTotal : 0), 0),
    subtotal: clinicBills.reduce((s, b) => s + (b.paymentStatus === 'PAID' ? b.subtotal : 0), 0),
  };

  // Combined stats
  const combinedStats = {
    totalBills: productStats.totalBills + clinicStats.totalBills,
    totalSales: productStats.totalSales + clinicStats.totalSales,
    totalGST: productStats.totalGST,
  };

  // Prepare chart data - only use filtered bills that match current filters
  const prepareSalesTrendData = (billsList) => {
    const trend = {};
    billsList.forEach(bill => {
      if (bill.paymentStatus === 'PAID') {
        const date = new Date(bill.createdAt).toISOString().split('T')[0];
        const dayName = new Date(bill.createdAt).toLocaleDateString('en-US', { weekday: 'short' });
        if (!trend[date]) {
          trend[date] = { date, dayName, productSales: 0, clinicSales: 0, totalSales: 0 };
        }
        if (bill.billType === 'PRODUCT') {
          trend[date].productSales += bill.grandTotal;
        } else {
          trend[date].clinicSales += bill.grandTotal;
        }
        trend[date].totalSales += bill.grandTotal;
      }
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
            {activeTab !== 'clinic' && (
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
                  <p className="text-sm text-slate-500">Subtotal (Before GST)</p>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(currentStats.subtotal)}</p>
                </div>
                <CurrencyRupeeIcon className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          </div>

          {/* Revenue Comparison */}
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
              </div>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Bill #</th>
                    <th>Type</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Subtotal</th>
                    <th>GST</th>
                    <th>Total</th>
                    <th>Method</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {currentBills.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-slate-400">
                        No bills found for the selected filters
                      </td>
                    </tr>
                  ) : currentBills.map((b) => (
                    <tr key={b._id}>
                      <td className="font-mono font-bold text-primary-700">{b.billNumber}</td>
                      <td>
                        <span className={`badge text-xs ${b.billType === 'PRODUCT' ? 'badge-blue' : 'badge-amber'}`}>
                          {b.billType}
                        </span>
                      </td>
                      <td>{b.clientName}</td>
                      <td className="text-xs text-slate-500">{formatDate(b.createdAt)}</td>
                      <td>{formatCurrency(b.subtotal)}</td>
                      <td className={b.billType === 'CLINIC' ? 'text-slate-400' : ''}>
                        {formatCurrency(b.gstAmount)}
                      </td>
                      <td className="font-bold">{formatCurrency(b.grandTotal)}</td>
                      <td>
                        <span className="badge badge-slate">{b.paymentMethod}</span>
                      </td>
                      <td>
                        <span className={`badge ${b.paymentStatus === 'PAID' ? 'badge-green' : 'badge-red'}`}>
                          {b.paymentStatus}
                        </span>
                      </td>
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
