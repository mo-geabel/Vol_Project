import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ roles = [] }) => {
  const { user, loading } = useAuth();

  // Show nothing or a spinner while determining auth status
  if (loading) return <div>Loading...</div>;

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
