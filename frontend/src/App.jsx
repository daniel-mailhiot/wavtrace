import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
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
            <Route path="/login" element={<AuthScreen />} />
            <Route path="/projects" element={<ProjectsScreen />} />
            <Route path="/projects/:id" element={<ProjectViewScreen />} />
            <Route path="/projects/:id/diff" element={<DiffScreen />} />
            <Route path="*" element={<Navigate to="/projects" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
