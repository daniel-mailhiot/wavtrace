import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

// Keep logged-in users off the auth screen, sending them to their projects
export default function GuestRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/projects" replace />;
  return <Outlet />;
}
