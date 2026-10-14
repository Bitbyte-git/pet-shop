import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    const roleRedirect = {
      'ADMIN': '/admin',
      'BILLING_MANAGER': '/billing',
      'CLINIC_MANAGER': '/clinic',
    };
    return <Navigate to={roleRedirect[user.role] || '/'} replace />;
  }
  return children;
}

export function GuestRoute({ children }) {
  const { user } = useAuth();
  if (user) {
    const roleRedirect = {
      'ADMIN': '/admin',
      'BILLING_MANAGER': '/billing',
      'CLINIC_MANAGER': '/clinic',
    };
    return <Navigate to={roleRedirect[user.role] || '/'} replace />;
  }
  return children;
}
