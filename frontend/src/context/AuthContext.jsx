import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Initialise user from localStorage immediately — no async blocking
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      if (stored && token) return JSON.parse(stored);
      return null;
    } catch { return null; }
  });
  // Start as false — we already have a synchronous user from localStorage
  const [loading, setLoading] = useState(false);

  // Background token validation — doesn't block rendering
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return; // No token, already showing login
    authAPI.getMe()
      .then(({ data }) => {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
      })
      .catch(() => {
        // Token invalid — clear and let route guard redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      });
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try { await authAPI.logout(); } catch {}
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  const isAdmin = user?.role === 'ADMIN';
  const isBillingManager = user?.role === 'BILLING_MANAGER';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, isBillingManager }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
