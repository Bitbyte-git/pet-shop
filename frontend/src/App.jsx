import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, GuestRoute } from './routes/ProtectedRoute';
import AuthLayout from './layouts/AuthLayout';
import AdminLayout from './layouts/AdminLayout';
import BillingLayout from './layouts/BillingLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';

// Admin Pages
import AdminDashboard from './pages/dashboard/AdminDashboard';
import BillingManagerDashboard from './pages/dashboard/BillingManagerDashboard';
import ClientsPage from './pages/clients/ClientsPage';
import ClientDetailPage from './pages/clients/ClientDetailPage';
import PetsPage from './pages/pets/PetsPage';
import PetDetailPage from './pages/pets/PetDetailPage';
import ProductsPage from './pages/products/ProductsPage';
import CategoriesPage from './pages/products/CategoriesPage';
import SuppliersPage from './pages/products/SuppliersPage';
import InventoryPage from './pages/inventory/InventoryPage';
import PurchasesPage from './pages/purchases/PurchasesPage';
import ConsultationsPage from './pages/clinic/ConsultationsPage';
import TreatmentsPage from './pages/clinic/TreatmentsPage';
import PrescriptionsPage from './pages/clinic/PrescriptionsPage';
import ClinicBillingPage from './pages/clinic/ClinicBillingPage';
import BillingHistoryPage from './pages/billing/BillingHistoryPage';
import NewBillPage from './pages/billing/NewBillPage';
import InvoiceDetailPage from './pages/billing/InvoiceDetailPage';
import UsersPage from './pages/users/UsersPage';
import ReportsPage from './pages/reports/ReportsPage';

// Billing Manager Pages (reuses some components)
import BMProductsPage from './pages/billing/BMProductsPage';
import BMCustomersPage from './pages/billing/BMCustomersPage';
import BMPrescriptionsPage from './pages/billing/BMPrescriptionsPage';

function AdminRoutes() {
  return (
    <ProtectedRoute roles={['ADMIN']}>
      <AdminLayout>
        <Routes>
          <Route index element={<AdminDashboard />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="clients/:id" element={<ClientDetailPage />} />
          <Route path="pets" element={<PetsPage />} />
          <Route path="pets/:id" element={<PetDetailPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="suppliers" element={<SuppliersPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="purchases" element={<PurchasesPage />} />
          <Route path="clinic/consultations" element={<ConsultationsPage />} />
          <Route path="clinic/treatments" element={<TreatmentsPage />} />
          <Route path="clinic/prescriptions" element={<PrescriptionsPage />} />
          <Route path="clinic/billing" element={<ClinicBillingPage />} />
          <Route path="billing" element={<BillingHistoryPage />} />
          <Route path="billing/:id" element={<InvoiceDetailPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </AdminLayout>
    </ProtectedRoute>
  );
}

function BillingRoutes() {
  return (
    <ProtectedRoute roles={['BILLING_MANAGER']}>
      <BillingLayout>
        <Routes>
          <Route index element={<BillingManagerDashboard />} />
          <Route path="new" element={<NewBillPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="customers" element={<ClientsPage />} />
          <Route path="customers/:id" element={<ClientDetailPage />} />
          <Route path="pets" element={<PetsPage />} />
          <Route path="pets/:id" element={<PetDetailPage />} />
          <Route path="history" element={<BillingHistoryPage />} />
          <Route path="history/:id" element={<InvoiceDetailPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="*" element={<Navigate to="/billing" replace />} />
        </Routes>
      </BillingLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={
          <GuestRoute>
            <AuthLayout><LoginPage /></AuthLayout>
          </GuestRoute>
        } />
        <Route path="/admin/*" element={<AdminRoutes />} />
        <Route path="/billing/*" element={<BillingRoutes />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}
