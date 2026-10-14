import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency, formatDateTime, formatDate } from '../../utils/helpers';
import SalesTrendChart from '../../components/charts/SalesTrendChart';
import {
  HeartIcon, BeakerIcon, CalendarIcon, ClockIcon, UsersIcon, UserCircleIcon,
  DocumentTextIcon, PhoneArrowUpRightIcon, ExclamationTriangleIcon, CurrencyRupeeIcon,
  ArrowTrendingUpIcon,
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

export default function ClinicManagerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getClinicManagerStats()
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!data) return null;

  const { stats, recentConsultations, upcomingFollowups, recentTreatments, followupAlerts, analytics } = data || {};

  // Ensure stats and analytics exist with defaults
  const statsData = stats || {};
  const analyticsData = analytics || {
    salesTrend: [],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Clinic Management Dashboard</h1>
          <p className="page-subtitle">Pet consultations, treatments, and follow-up tracking</p>
        </div>
        <div className="flex gap-2">
          <Link to="/clinic/billing" className="btn btn-primary gap-2">
            <DocumentTextIcon className="h-4 w-4" /> New Clinic Bill
          </Link>
          <Link to="/clinic/followups" className="btn btn-secondary gap-2">
            <ClockIcon className="h-4 w-4" /> Follow-ups
          </Link>
        </div>
      </div>

      {/* KPI Cards - Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BeakerIcon} iconBg="bg-emerald-600" value={statsData.totalConsultations || 0} label="Total Consultations" />
        <StatCard icon={HeartIcon} iconBg="bg-blue-600" value={statsData.totalTreatments || 0} label="Total Treatments" />
        <StatCard icon={UsersIcon} iconBg="bg-purple-600" value={statsData.totalClients || 0} label="Active Customers" />
        <StatCard icon={UserCircleIcon} iconBg="bg-orange-600" value={statsData.totalPets || 0} label="Registered Pets" />
      </div>

      {/* Sales Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={ArrowTrendingUpIcon} iconBg="bg-emerald-600" value={formatCurrency(statsData.todayClinicSales || 0)} label="Today's Clinic Sales" sub="Internal records (No GST)" />
        <StatCard icon={DocumentTextIcon} iconBg="bg-blue-600" value={statsData.todayClinicBills || 0} label="Today's Bills" sub="Clinic records created" />
        <StatCard icon={CurrencyRupeeIcon} iconBg="bg-purple-600" value={formatCurrency(statsData.todayClinicSales || 0)} label="Total Revenue" sub="Since inception" />
      </div>

      {/* Follow-up Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={ClockIcon} iconBg="bg-amber-600" value={statsData.upcomingFollowups || 0} label="Upcoming Follow-ups" sub="Next 7 days" />
        <StatCard icon={PhoneArrowUpRightIcon} iconBg="bg-teal-600" value={statsData.pendingFollowups || 0} label="Pending Follow-ups" sub="Not contacted yet" />
        <StatCard icon={CalendarIcon} iconBg="bg-rose-600" value={statsData.overdueFollowups || 0} label="Overdue Follow-ups" sub="Missed appointments" />
      </div>

      {/* Analytics Chart */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-slate-800">7-Day Clinic Sales Trend</h3>
        </div>
        <div className="card-body">
          <SalesTrendChart data={analyticsData.salesTrend} showClinicOnly={true} />
        </div>
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />
              Follow-up Alerts
            </h3>
            <Link to="/clinic/followups" className="text-xs text-primary-600 hover:underline">View All</Link>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {(followupAlerts || [])?.length === 0 ? (
                <p className="text-sm text-green-600 text-center py-4">✓ No pending follow-ups</p>
              ) : (followupAlerts || [])?.slice(0, 5).map((alert) => (
                <div key={alert._id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-800">{alert.clientName}</p>
                    <p className="text-xs text-slate-500">🐶 {alert.petName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-amber-700">{alert.daysUntil} days</p>
                    <p className="text-xs text-slate-500">{alert.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Today's Appointments</h3>
            <Link to="/clinic/consultations" className="text-xs text-primary-600 hover:underline">View All</Link>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {(recentConsultations || [])?.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No consultations today</p>
              ) : (recentConsultations || [])?.slice(0, 5).map((consult) => (
                <div key={consult._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-800">{consult.clientName}</p>
                    <p className="text-xs text-slate-500">🐶 {consult.petName} · {consult.reason}</p>
                  </div>
                  <span className="badge badge-blue">{formatDateTime(consult.consultationDate)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Treatments */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Recent Treatments</h3>
          <Link to="/clinic/treatments" className="text-xs text-primary-600 hover:underline">View All</Link>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Pet</th>
                <th>Owner</th>
                <th>Treatment</th>
                <th>Date</th>
                <th>Follow-up</th>
              </tr>
            </thead>
            <tbody>
              {(recentTreatments || [])?.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-6 text-slate-400">No treatments recorded yet</td></tr>
              ) : (recentTreatments || [])?.slice(0, 5).map((treatment) => (
                <tr key={treatment._id}>
                  <td>🐶 {treatment.petName}</td>
                  <td>{treatment.clientName}</td>
                  <td>{treatment.description}</td>
                  <td className="text-xs text-slate-500">{formatDateTime(treatment.date)}</td>
                  <td>
                    {treatment.followUpDate ? (
                      <span className="badge badge-amber">{formatDate(treatment.followUpDate)}</span>
                    ) : (
                      <span className="badge badge-slate">No follow-up</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
