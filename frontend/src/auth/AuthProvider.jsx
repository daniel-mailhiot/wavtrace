import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { AuthContext } from './AuthContext';

// On mount, a 401 from /api/auth/me is the normal logged-out case 
// `loading` lets routes wait instead of flashing the login screen
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/api/auth/me')
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  
  const register = async (fields) => {
    setUser(await api.post('/api/auth/register', fields));
  };

  const login = async (credentials) => {
    setUser(await api.post('/api/auth/login', credentials));
  };

  const logout = async () => {
    await api.post('/api/auth/logout');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
