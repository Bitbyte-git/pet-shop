import { format, parseISO, isValid } from 'date-fns';

export const formatCurrency = (amount) => {
  const num = Number(amount || 0);
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(num);
};

export const formatDate = (date) => {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' ? parseISO(date) : new Date(date);
    if (!isValid(d)) return '—';
    return format(d, 'dd MMM yyyy');
  } catch { return '—'; }
};

export const formatDateTime = (date) => {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' ? parseISO(date) : new Date(date);
    if (!isValid(d)) return '—';
    return format(d, 'dd MMM yyyy, hh:mm a');
  } catch { return '—'; }
};

export const formatTime = (date) => {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' ? parseISO(date) : new Date(date);
    return format(d, 'hh:mm a');
  } catch { return '—'; }
};

export const getStockStatusBadge = (product) => {
  if (!product) return { label: '—', class: 'badge-slate' };
  const { currentStock, reorderLevel } = product;
  if (currentStock === 0) return { label: 'Out of Stock', class: 'badge-red' };
  if (currentStock <= reorderLevel) return { label: 'Low Stock', class: 'badge-yellow' };
  return { label: 'In Stock', class: 'badge-green' };
};

export const getExpiryStatusBadge = (expiryDate) => {
  if (!expiryDate) return { label: 'N/A', class: 'badge-slate' };
  const now = new Date();
  const expiry = new Date(expiryDate);
  const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return { label: 'Expired', class: 'badge-red' };
  if (daysLeft <= 90) return { label: `${daysLeft}d left`, class: 'badge-orange' };
  return { label: 'Valid', class: 'badge-green' };
};

export const getPaymentStatusBadge = (status) => {
  const map = {
    PAID: 'badge-green',
    PENDING: 'badge-yellow',
    FAILED: 'badge-red',
    CANCELLED: 'badge-slate',
    REFUNDED: 'badge-blue',
  };
  return map[status] || 'badge-slate';
};

export const errorMessage = (err) =>
  err?.response?.data?.message || err?.message || 'An unexpected error occurred.';
