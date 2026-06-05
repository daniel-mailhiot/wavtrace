import { createContext, useContext } from 'react';

// Context lives in its own file so fast refresh keeps working and AuthProvider doesn't become a circular import
export const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}
