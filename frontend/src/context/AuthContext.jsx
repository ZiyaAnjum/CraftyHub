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

  const register = async ({ name, email, phone, password, termsAccepted }) => {
    const data = await api.post('/api/auth/register', { name, email, phone, password, termsAccepted });
    setUser(data.user);
    return data.user;
  };

  const updateProfile = async (updates) => {
    const data = await api.patch('/api/auth/me', updates);
    if (data?.user) {
      setUser(data.user);
    }
    return data?.user;
  };

  const verifyEmail = async (token) => {
    const data = await api.post('/api/auth/verify-email', { token });
    if (data?.user) {
      setUser(data.user);
    }
    return data;
  };

  const resendVerification = async (email) => {
    return await api.post('/api/auth/resend-verification', { email });
  };

  const forgotPassword = async (email) => {
    return await api.post('/api/auth/forgot-password', { email });
  };

  const resetPassword = async (token, newPassword) => {
    return await api.post('/api/auth/reset-password', { token, password: newPassword });
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
    updateProfile,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
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
