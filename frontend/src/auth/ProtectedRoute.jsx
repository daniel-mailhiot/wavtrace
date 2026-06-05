import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

// While auth is loading, render nothing so a refresh doesn't flash the login screen
export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}
