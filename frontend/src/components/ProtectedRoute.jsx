import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const ProtectedRoute = ({ roles = [] }) => {
  const { user, loading } = useAuth();
  const { t } = useTranslation();

  // Show nothing or a spinner while determining auth status
  if (loading) return <div>{t('common.loading')}...</div>;

  // Not logged in?
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check roles if specified
  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Authorized
  return <Outlet />;
};

export default ProtectedRoute;
