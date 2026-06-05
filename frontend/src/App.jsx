import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import ProtectedRoute from './auth/ProtectedRoute';
import GuestRoute from './auth/GuestRoute';
import AuthScreen from './screens/AuthScreen';
import ProjectsScreen from './screens/ProjectsScreen';
import ProjectViewScreen from './screens/ProjectViewScreen';
import DiffScreen from './screens/DiffScreen';

// Everything renders inside .wt so the design tokens and fonts apply
// Modals are overlay state inside screens (not routes), so only the real pages live here
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="wt">
          <Routes>
            {/* Logged-in users skip auth screen */}
            <Route element={<GuestRoute />}>
              <Route path="/login" element={<AuthScreen />} />
            </Route>
            {/* otherwise needs a session */}
            <Route element={<ProtectedRoute />}>
              <Route path="/projects" element={<ProjectsScreen />} />
              <Route path="/projects/:id" element={<ProjectViewScreen />} />
              <Route path="/projects/:id/diff" element={<DiffScreen />} />
            </Route>
            <Route path="*" element={<Navigate to="/projects" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
