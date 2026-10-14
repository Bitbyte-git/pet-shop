import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HomeIcon, PlusCircleIcon, UsersIcon, ShoppingBagIcon, CubeIcon,
  ClockIcon, ReceiptPercentIcon, ChartBarIcon,
  Bars3Icon, ArrowRightOnRectangleIcon, BellIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const navItems = [
  { label: 'Dashboard', to: '/billing', icon: HomeIcon, exact: true },
  { label: 'New Bill', to: '/billing/new', icon: PlusCircleIcon, highlight: true },
  { label: 'Products', to: '/billing/products', icon: ShoppingBagIcon },
  { label: 'Inventory', to: '/billing/inventory', icon: CubeIcon },
  { label: 'Customers', to: '/billing/customers', icon: UsersIcon },
  { label: 'Billing History', to: '/billing/history', icon: ClockIcon },
  { label: 'Reports', to: '/billing/reports', icon: ChartBarIcon },
];

export default function BillingLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out.');
    navigate('/login');
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full w-64 bg-gradient-to-b from-navy-900 via-navy-800 to-navy-900 shadow-2xl">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10 bg-gradient-to-r from-shop-500/20 to-transparent">
        <div className="w-10 h-10 bg-gradient-to-br from-shop-500 to-shop-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-shop-500/30">
          <span className="text-white text-xl">🏪</span>
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-tight">Paws & Care</p>
          <p className="text-shop-300 text-xs font-medium">Pet Shop</p>
        </div>
      </div>

      {/* Role badge */}
      <div className="mx-3 mt-3 mb-1">
        <div className="flex items-center gap-2 bg-gradient-to-r from-shop-500/30 to-shop-600/30 rounded-xl px-3 py-2.5 border border-shop-500/30 shadow-inner">
          <ReceiptPercentIcon className="h-4 w-4 text-shop-300" />
          <span className="text-shop-200 text-xs font-semibold">Billing Manager</span>
        </div>
      </div>

      {/* Quick action */}
      <div className="px-3 mt-2">
        <NavLink to="/billing/new"
          className="flex items-center gap-2 w-full btn bg-gradient-to-r from-shop-500 to-shop-600 hover:from-shop-600 hover:to-shop-700 text-white py-2.5 rounded-xl font-semibold text-sm justify-center shadow-lg shadow-shop-500/30"
        >
          <PlusCircleIcon className="h-5 w-5" />
          Create New Bill
        </NavLink>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3 space-y-1 mt-2">
        {navItems.filter((i) => !i.highlight).map((item) => (
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
          <div className="w-9 h-9 bg-gradient-to-br from-shop-500 to-shop-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
            <span className="text-white text-xs font-bold">{user?.name?.[0]?.toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
            <p className="text-slate-400 text-xs truncate">Billing Manager</p>
          </div>
          <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10">
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-slate-50 overflow-hidden">
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
          <NavLink to="/billing/new" className="btn btn-shop btn-sm hidden sm:flex shadow-lg shadow-shop-500/30">
            <PlusCircleIcon className="h-4 w-4" />
            New Bill
          </NavLink>
          <div className="flex items-center gap-3 text-sm">
            <div className="w-9 h-9 bg-gradient-to-br from-shop-500 to-shop-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white text-xs font-bold">{user?.name?.[0]?.toUpperCase()}</span>
            </div>
            <div className="hidden sm:block">
              <p className="font-semibold text-slate-800">{user?.name}</p>
              <p className="text-xs text-slate-500">Billing Manager</p>
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
