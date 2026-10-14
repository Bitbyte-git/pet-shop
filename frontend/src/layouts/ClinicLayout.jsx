import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HomeIcon, HeartIcon, BeakerIcon, CalendarIcon, ClipboardDocumentListIcon,
  UsersIcon, UserCircleIcon, ClockIcon, ChartBarIcon, DocumentTextIcon,
  Bars3Icon, ArrowRightOnRectangleIcon, BellIcon, PhoneArrowUpRightIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const navItems = [
  { label: 'Dashboard', to: '/clinic', icon: HomeIcon, exact: true },
  { label: 'Consultations', to: '/clinic/consultations', icon: BeakerIcon },
  { label: 'Treatments', to: '/clinic/treatments', icon: HeartIcon },
  { label: 'Clinic Billing', to: '/clinic/billing', icon: DocumentTextIcon },
  { label: 'Follow-ups', to: '/clinic/followups', icon: ClockIcon },
  { label: 'Customers', to: '/clinic/customers', icon: UsersIcon },
  { label: 'Pets', to: '/clinic/pets', icon: UserCircleIcon },
  { label: 'Reports', to: '/clinic/reports', icon: ChartBarIcon },
];

export default function ClinicLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out.');
    navigate('/login');
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full w-64 bg-gradient-to-b from-emerald-900 via-emerald-800 to-emerald-900 shadow-2xl">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10 bg-gradient-to-r from-emerald-500/20 to-transparent">
        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/30">
          <span className="text-white text-xl">🏥</span>
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-tight">Paws & Care</p>
          <p className="text-emerald-300 text-xs font-medium">Pet Clinic</p>
        </div>
      </div>

      {/* Role badge */}
      <div className="mx-3 mt-3 mb-1">
        <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-500/30 to-emerald-600/30 rounded-xl px-3 py-2.5 border border-emerald-500/30 shadow-inner">
          <BeakerIcon className="h-4 w-4 text-emerald-300" />
          <span className="text-emerald-200 text-xs font-semibold">Clinic Manager</span>
        </div>
      </div>

      {/* Quick action */}
      <div className="px-3 mt-2">
        <NavLink to="/clinic/billing"
          className="flex items-center gap-2 w-full btn bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-2.5 rounded-xl font-semibold text-sm justify-center shadow-lg shadow-emerald-500/30"
        >
          <DocumentTextIcon className="h-5 w-5" />
          New Clinic Bill
        </NavLink>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3 space-y-1 mt-2">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.exact}
            className={({ isActive }) => isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-white/10 p-3 bg-gradient-to-t from-black/20 to-transparent">
        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors">
          <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
            <span className="text-white text-xs font-bold">{user?.name?.[0]?.toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
            <p className="text-slate-400 text-xs truncate">Clinic Manager</p>
          </div>
          <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10">
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-50 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex h-full flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full z-10">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-4 py-3 flex items-center gap-4 flex-shrink-0 shadow-sm">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden btn btn-secondary btn-sm">
            <Bars3Icon className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <NavLink to="/clinic/billing" className="btn btn-shop btn-sm hidden sm:flex bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/30">
            <DocumentTextIcon className="h-4 w-4" />
            New Clinic Bill
          </NavLink>
          <div className="flex items-center gap-3 text-sm">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white text-xs font-bold">{user?.name?.[0]?.toUpperCase()}</span>
            </div>
            <div className="hidden sm:block">
              <p className="font-semibold text-slate-800">{user?.name}</p>
              <p className="text-xs text-slate-500">Clinic Manager</p>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto animate-fade-in-up">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
