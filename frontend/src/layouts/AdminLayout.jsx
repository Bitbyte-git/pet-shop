import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HomeIcon, UsersIcon, HeartIcon, ShoppingBagIcon,
  CubeIcon, TruckIcon, ReceiptRefundIcon, ClipboardDocumentListIcon,
  BeakerIcon, DocumentTextIcon, ChartBarIcon, UserGroupIcon,
  Bars3Icon, XMarkIcon, ChevronDownIcon, ArrowRightOnRectangleIcon,
  BellIcon, ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const navItems = [
  { label: 'Dashboard', to: '/admin', icon: HomeIcon, exact: true },
  { label: 'Monitor Billing', to: '/admin/billing', icon: ReceiptRefundIcon },
  { label: 'Inventory', to: '/admin/inventory', icon: CubeIcon },
  { label: 'Customers', to: '/admin/clients', icon: UsersIcon },
  { label: 'Orders (Purchases)', to: '/admin/purchases', icon: TruckIcon },
  { label: 'Suppliers', to: '/admin/suppliers', icon: TruckIcon },
  {
    label: 'Services / Clinic', icon: BeakerIcon, children: [
      { label: 'Consultations', to: '/admin/clinic/consultations' },
      { label: 'Treatments', to: '/admin/clinic/treatments' },
      { label: 'Prescriptions', to: '/admin/clinic/prescriptions' },
      { label: 'Clinic Billing', to: '/admin/clinic/billing' },
    ],
  },
  {
    label: 'Shop Products', icon: ShoppingBagIcon, children: [
      { label: 'Products', to: '/admin/products' },
      { label: 'Categories', to: '/admin/categories' },
    ],
  },
  { label: 'Reports', to: '/admin/reports', icon: ChartBarIcon },
  { label: 'Billing Managers', to: '/admin/users', icon: UserGroupIcon },
];

function NavItem({ item, collapsed }) {
  const [open, setOpen] = useState(false);
  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className="sidebar-link-inactive w-full"
        >
          <item.icon className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <><span className="flex-1 text-left">{item.label}</span><ChevronDownIcon className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} /></>}
        </button>
        {open && !collapsed && (
          <div className="ml-4 mt-1 space-y-0.5 border-l border-white/20 pl-3">
            {item.children.map((child) => (
              <NavLink key={child.to} to={child.to}
                className={({ isActive }) => isActive ? 'sidebar-link-active text-sm' : 'sidebar-link-inactive text-sm'}
              >
                {child.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  }
  return (
    <NavLink to={item.to} end={item.exact}
      className={({ isActive }) => isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}
    >
      <item.icon className="h-5 w-5 flex-shrink-0" />
      {!collapsed && <span>{item.label}</span>}
    </NavLink>
  );
}

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out.');
    navigate('/login');
  };

  const Sidebar = () => (
    <div className={`flex flex-col h-full bg-navy-900 transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="w-9 h-9 bg-primary-500 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-white font-black text-lg">🐾</span>
        </div>
        {!collapsed && (
          <div>
            <p className="text-white font-bold text-sm leading-tight">Paws & Care</p>
            <p className="text-primary-300 text-xs">Pet Clinic</p>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="ml-auto text-slate-400 hover:text-white hidden lg:block">
          <Bars3Icon className="h-5 w-5" />
        </button>
      </div>

      {/* Role badge */}
      {!collapsed && (
        <div className="mx-3 mt-3 mb-1">
          <div className="flex items-center gap-2 bg-primary-700/30 rounded-lg px-3 py-2">
            <ShieldCheckIcon className="h-4 w-4 text-primary-300" />
            <span className="text-primary-200 text-xs font-medium">Administrator</span>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3 space-y-0.5">
        {navItems.map((item, i) => (
          <NavItem key={i} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-white/10 p-3">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{user?.name?.[0]?.toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
              <p className="text-slate-400 text-xs truncate">{user?.email}</p>
            </div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 transition-colors">
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <button onClick={handleLogout} className="w-full flex justify-center text-slate-400 hover:text-red-400">
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex h-full flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 z-10">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-4 flex-shrink-0">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden btn btn-secondary btn-sm">
            <Bars3Icon className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <button className="btn btn-secondary btn-sm relative">
            <BellIcon className="h-5 w-5 text-slate-500" />
          </button>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <div className="w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">{user?.name?.[0]?.toUpperCase()}</span>
            </div>
            <span className="font-medium hidden sm:block">{user?.name}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
