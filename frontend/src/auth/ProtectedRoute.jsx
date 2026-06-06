import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';
import LoadingScreen from '../components/LoadingScreen';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}
