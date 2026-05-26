import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'advertiser' | 'webmaster' | 'admin';
  balance: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: object) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = localStorage.getItem('session_id');
    if (session) {
      api.me().then(data => {
        if (data.id) setUser(data);
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api.login({ email, password });
    if (data.error) throw new Error(data.error);
    localStorage.setItem('session_id', data.session_id);
    setUser({ id: data.user_id, name: data.name, email, role: data.role, balance: data.balance });
  };

  const register = async (formData: object) => {
    const data = await api.register(formData);
    if (data.error) throw new Error(data.error);
    localStorage.setItem('session_id', data.session_id);
    setUser({ id: data.user_id, name: data.name, email: (formData as any).email, role: data.role, balance: 0 });
  };

  const logout = () => {
    api.logout();
    localStorage.removeItem('session_id');
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
