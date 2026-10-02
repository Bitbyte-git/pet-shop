import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};

// ── Clients ───────────────────────────────────────────────────────────────────
export const clientAPI = {
  getAll: (params) => api.get('/clients', { params }),
  search: (q) => api.get('/clients/search', { params: { q } }),
  getById: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
};

// ── Pets ──────────────────────────────────────────────────────────────────────
export const petAPI = {
  getAll: (params) => api.get('/pets', { params }),
  search: (q) => api.get('/pets/search', { params: { q } }),
  getById: (id) => api.get(`/pets/${id}`),
  getByOwner: (ownerId) => api.get(`/pets/by-owner/${ownerId}`),
  create: (data) => api.post('/pets', data),
  update: (id, data) => api.put(`/pets/${id}`, data),
};

// ── Products ──────────────────────────────────────────────────────────────────
export const productAPI = {
  getAll: (params) => api.get('/products', { params }),
  search: (q) => api.get('/products/search', { params: { q } }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  getLowStock: () => api.get('/products/low-stock'),
  getExpiring: (days) => api.get('/products/expiring', { params: { days } }),
};

// ── Categories ────────────────────────────────────────────────────────────────
export const categoryAPI = {
  getAll: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

// ── Suppliers ─────────────────────────────────────────────────────────────────
export const supplierAPI = {
  getAll: (params) => api.get('/suppliers', { params }),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
};

// ── Inventory ─────────────────────────────────────────────────────────────────
export const inventoryAPI = {
  getAll: (params) => api.get('/inventory', { params }),
  getLowStock: () => api.get('/inventory/low-stock'),
  getExpiry: (days) => api.get('/inventory/expiry', { params: { days } }),
  adjust: (data) => api.post('/inventory/adjustment', data),
  getHistory: (productId, params) => api.get(`/inventory/history/${productId}`, { params }),
};

// ── Purchases ─────────────────────────────────────────────────────────────────
export const purchaseAPI = {
  getAll: (params) => api.get('/purchases', { params }),
  getById: (id) => api.get(`/purchases/${id}`),
  create: (data) => api.post('/purchases', data),
};

// ── Clinic ────────────────────────────────────────────────────────────────────
export const clinicAPI = {
  getConsultations: (params) => api.get('/clinic/consultations', { params }),
  getConsultationById: (id) => api.get(`/clinic/consultations/${id}`),
  createConsultation: (data) => api.post('/clinic/consultations', data),
  updateConsultation: (id, data) => api.put(`/clinic/consultations/${id}`, data),
  getTreatments: (params) => api.get('/clinic/treatments', { params }),
  createTreatment: (data) => api.post('/clinic/treatments', data),
  updateTreatment: (id, data) => api.put(`/clinic/treatments/${id}`, data),
  getClinicBillings: (params) => api.get('/clinic/billing', { params }),
  getClinicBillingById: (id) => api.get(`/clinic/billing/${id}`),
  createClinicBilling: (data) => api.post('/clinic/billing', data),
};

// ── Prescriptions ─────────────────────────────────────────────────────────────
export const prescriptionAPI = {
  getAll: (params) => api.get('/prescriptions', { params }),
  getById: (id) => api.get(`/prescriptions/${id}`),
  create: (data) => api.post('/prescriptions', data),
  update: (id, data) => api.put(`/prescriptions/${id}`, data),
};

export const billingAPI = {
  createBill: (data) => api.post('/billing/product', data),
  getAll: (params) => api.get('/billing/product', { params }),
  getHistory: (params) => api.get('/billing/history', { params }),
  getById: (id) => api.get(`/billing/product/${id}`),
  getPdfUrl: (id, format = 'a4') => {
    const token = localStorage.getItem('token') || '';
    return `/api/billing/product/${id}/pdf?token=${token}&format=${format}`;
  },
  downloadPdf: (id, invoiceNumber = 'Invoice', format = 'a4') => {
    const token = localStorage.getItem('token') || '';
    const url = `/api/billing/product/${id}/pdf?token=${token}&format=${format}`;
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.download = `${format === 'thermal' ? 'Receipt' : 'Invoice'}-${invoiceNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
  printPdf: (id, format = 'a4') => {
    const token = localStorage.getItem('token') || '';
    const url = `/api/billing/product/${id}/pdf?token=${token}&disposition=inline&format=${format}`;
    const win = window.open(url, '_blank');
    if (win) {
      win.focus();
    }
  },
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const userAPI = {
  getAll: () => api.get('/users'),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  toggleStatus: (id) => api.patch(`/users/${id}/toggle-status`),
  changePassword: (data) => api.put('/users/change-password', data),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardAPI = {
  getAdminStats: () => api.get('/dashboard/admin'),
  getBillingManagerStats: () => api.get('/dashboard/billing-manager'),
};
