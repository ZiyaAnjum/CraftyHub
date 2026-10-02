import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../lib/api';
import { clearDraftStorage } from '../hooks/useDraft';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const userRef = useRef(user);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Check current session on app mount
  const checkAuth = useCallback(async () => {
    try {
      const data = await api.get('/api/auth/me');
      if (data?.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();

    const handleSessionLost = () => {
      if (userRef.current) clearDraftStorage();
      setUser(null);
    };

    window.addEventListener('session-lost', handleSessionLost);
    return () => window.removeEventListener('session-lost', handleSessionLost);
  }, [checkAuth]);

  const login = async ({ email, password }) => {
    const data = await api.post('/api/auth/login', { email, password });
    setUser(data.user);
    return data.user;
  };

  const register = async ({ name, email, phone, password }) => {
    const data = await api.post('/api/auth/register', { name, email, phone, password });
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // Ignore network errors during logout
    } finally {
      setUser(null);
      clearDraftStorage();
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    checkAuth,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
