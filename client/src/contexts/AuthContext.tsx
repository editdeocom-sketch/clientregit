import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api from '@/services/api';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  register: (name: string, email: string, password: string, role?: string, phone?: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { setUser(null); setLoading(false); return; }
      const res = await api.get<{ success: boolean; data: User }>('/auth/me');
      if (res.success) { setUser(res.data); } else { localStorage.removeItem('token'); localStorage.removeItem('user'); setUser(null); }
    } catch { localStorage.removeItem('token'); localStorage.removeItem('user'); setUser(null); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) { try { setUser(JSON.parse(storedUser)); } catch { localStorage.removeItem('user'); } }
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post<{ success: boolean; data: User; token: string; error?: string }>('/auth/login', { email, password });
      if (res.success) { localStorage.setItem('token', res.token); localStorage.setItem('user', JSON.stringify(res.data)); setUser(res.data); return { success: true, user: res.data }; }
      return { success: false, error: res.error || 'Login failed' };
    } catch (err: unknown) { return { success: false, error: err instanceof Error ? err.message : 'Login failed' }; }
  };

  const register = async (name: string, email: string, password: string, role?: string, phone?: string) => {
    try {
      const res = await api.post<{ success: boolean; data: User; token: string; error?: string }>('/auth/register', { name, email, password, role, phone });
      if (res.success) { localStorage.setItem('token', res.token); localStorage.setItem('user', JSON.stringify(res.data)); setUser(res.data); return { success: true, user: res.data }; }
      return { success: false, error: res.error || 'Registration failed' };
    } catch (err: unknown) { return { success: false, error: err instanceof Error ? err.message : 'Registration failed' }; }
  };

  const logout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); setUser(null); window.location.href = '/login'; };
  const updateUser = (data: Partial<User>) => { if (user) { const updated = { ...user, ...data }; setUser(updated); localStorage.setItem('user', JSON.stringify(updated)); } };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
