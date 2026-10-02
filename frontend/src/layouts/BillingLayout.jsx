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
    <div className="flex flex-col h-full w-64 bg-navy-900">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="w-9 h-9 bg-shop-500 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-white text-lg">🏪</span>
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-tight">Paws & Care</p>
          <p className="text-shop-400 text-xs">Pet Shop</p>
        </div>
      </div>

      {/* Role badge */}
      <div className="mx-3 mt-3 mb-1">
        <div className="flex items-center gap-2 bg-shop-500/20 rounded-lg px-3 py-2">
          <ReceiptPercentIcon className="h-4 w-4 text-shop-400" />
          <span className="text-shop-300 text-xs font-medium">Billing Manager</span>
        </div>
      </div>

      {/* Quick action */}
      <div className="px-3 mt-2">
        <NavLink to="/billing/new"
          className="flex items-center gap-2 w-full btn bg-shop-500 hover:bg-shop-600 text-white py-2.5 rounded-xl font-semibold text-sm justify-center"
        >
          <PlusCircleIcon className="h-5 w-5" />
          Create New Bill
        </NavLink>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 mt-2">
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
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-shop-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">{user?.name?.[0]?.toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
            <p className="text-slate-400 text-xs truncate">Billing Manager</p>
          </div>
          <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 transition-colors">
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex h-full flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full z-10">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-4 flex-shrink-0">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden btn btn-secondary btn-sm">
            <Bars3Icon className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <NavLink to="/billing/new" className="btn btn-shop btn-sm hidden sm:flex">
            <PlusCircleIcon className="h-4 w-4" />
            New Bill
          </NavLink>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <div className="w-7 h-7 bg-shop-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">{user?.name?.[0]?.toUpperCase()}</span>
            </div>
            <span className="font-medium hidden sm:block">{user?.name}</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
