import React from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Layout } from './components/Layout';
import { RequireAuth, RequireAdmin } from './components/RequireAuth';
import { AdminLayout } from './components/layout/AdminLayout';
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { CreatePage } from './pages/CreatePage';
import { OrdersPage } from './pages/OrdersPage';
import { TrackPage } from './pages/TrackPage';
import { AccountPage } from './pages/AccountPage';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';
import { GiftDetailPage } from './pages/GiftDetailPage';
import { AdminItemsPage } from './pages/AdminItemsPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminOrdersPage } from './pages/AdminOrdersPage';
import { AdminOrderDetailPage } from './pages/AdminOrderDetailPage';

function LegacyGiftRedirect() {
  const { slug } = useParams();
  return <Navigate to={`/items/${slug}`} replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public Storefront Routes */}
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="explore" element={<ExplorePage />} />
        <Route path="gifts/:slug" element={<LegacyGiftRedirect />} />
        <Route path="items/:slug" element={<GiftDetailPage />} />
        <Route path="create" element={<CreatePage />} />
        <Route path="track" element={<TrackPage />} />
        <Route path="signin" element={<SignInPage />} />
        <Route path="signup" element={<SignUpPage />} />

        {/* Protected Customer Routes */}
        <Route element={<RequireAuth />}>
          <Route path="orders" element={<OrdersPage />} />
          <Route path="account" element={<AccountPage />} />
        </Route>
      </Route>

      {/* Admin Login (Standalone) */}
      <Route path="/admin/login" element={<AdminLoginPage />} />

      {/* Protected Admin Routes */}
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="orders/:orderNumber" element={<AdminOrderDetailPage />} />
        <Route path="items" element={<AdminItemsPage />} />
        <Route path="gifts" element={<Navigate to="/admin/items" replace />} />
      </Route>

      {/* Catch-all Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
