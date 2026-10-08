import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function RequireAuth({ adminOnly = false, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-blush-200 animate-pulse"></div>
          <div className="absolute inset-0 rounded-full border-4 border-blush-500 border-t-transparent animate-spin"></div>
        </div>
        <p className="mt-4 font-serif text-stone-600 text-sm tracking-wide">
          Verifying your session...
        </p>
      </div>
    );
  }

  if (!user) {
    const currentPath = location.pathname + location.search;
    const loginTarget = adminOnly ? '/admin/login' : '/signin';
    return <Navigate to={`${loginTarget}?next=${encodeURIComponent(currentPath)}`} replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/admin/login?error=unauthorized" replace />;
  }

  return children ? children : <Outlet />;
}

export function RequireAdmin({ children }) {
  return <RequireAuth adminOnly={true}>{children}</RequireAuth>;
}
