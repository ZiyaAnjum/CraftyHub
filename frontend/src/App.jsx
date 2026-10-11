import React, { Suspense } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Layout } from './components/Layout';
import { RequireAuth, RequireAdmin } from './components/RequireAuth';
import { AdminLayout } from './components/layout/AdminLayout';
import { ErrorBoundary } from './components/ErrorBoundary';

// Customer Storefront Pages (eager loaded for snappy user navigation)
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { CreatePage } from './pages/CreatePage';
import { OrdersPage } from './pages/OrdersPage';
import { TrackPage } from './pages/TrackPage';
import { AccountPage } from './pages/AccountPage';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';
import { ItemDetailPage } from './pages/ItemDetailPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { GiftBuilderPage } from './pages/GiftBuilderPage';
import { HamperBuilderPage } from './pages/HamperBuilderPage';

// Admin Pages (Lazy loaded with React.lazy + Suspense so customers never download admin code)
const AdminDashboardPage = React.lazy(() =>
  import('./pages/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage }))
);
const AdminOrdersPage = React.lazy(() =>
  import('./pages/AdminOrdersPage').then((m) => ({ default: m.AdminOrdersPage }))
);
const AdminOrderDetailPage = React.lazy(() =>
  import('./pages/AdminOrderDetailPage').then((m) => ({ default: m.AdminOrderDetailPage }))
);
const AdminItemsPage = React.lazy(() =>
  import('./pages/AdminItemsPage').then((m) => ({ default: m.AdminItemsPage }))
);
const AdminCustomersPage = React.lazy(() =>
  import('./pages/AdminCustomersPage').then((m) => ({ default: m.AdminCustomersPage }))
);
const AdminLoginPage = React.lazy(() =>
  import('./pages/AdminLoginPage').then((m) => ({ default: m.AdminLoginPage }))
);
const NotFoundPage = React.lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
);

function AdminLoadingFallback() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center p-8">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-stone-200 border-t-gold-500 animate-spin" />
        <span className="text-xs font-medium text-stone-500">Loading portal...</span>
      </div>
    </div>
  );
}

function LegacyGiftRedirect() {
  const { slug } = useParams();
  return <Navigate to={`/items/${slug}`} replace />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Public Storefront Routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="explore" element={<ExplorePage />} />
          <Route path="gifts/:slug" element={<LegacyGiftRedirect />} />
          <Route path="items/:slug" element={<ItemDetailPage />} />
          <Route path="gift-builder" element={<GiftBuilderPage />} />
          <Route path="hamper-builder" element={<HamperBuilderPage />} />
          <Route path="create" element={<CreatePage />} />
          <Route path="track" element={<TrackPage />} />
          <Route path="signin" element={<SignInPage />} />
          <Route path="login" element={<Navigate to="/signin" replace />} />
          <Route path="signup" element={<SignUpPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
          <Route path="verify-email" element={<VerifyEmailPage />} />
          <Route path="privacy" element={<PrivacyPolicyPage />} />

          {/* Protected Customer Routes */}
          <Route element={<RequireAuth />}>
            <Route path="orders" element={<OrdersPage />} />
            <Route path="account" element={<AccountPage />} />
          </Route>

          {/* 404 Catch-all route within customer layout */}
          <Route
            path="*"
            element={
              <Suspense fallback={<AdminLoadingFallback />}>
                <NotFoundPage />
              </Suspense>
            }
          />
        </Route>

        {/* Admin Login (Standalone) */}
        <Route
          path="/admin/login"
          element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <AdminLoginPage />
            </Suspense>
          }
        />

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
          <Route
            path="dashboard"
            element={
              <Suspense fallback={<AdminLoadingFallback />}>
                <AdminDashboardPage />
              </Suspense>
            }
          />
          <Route
            path="orders"
            element={
              <Suspense fallback={<AdminLoadingFallback />}>
                <AdminOrdersPage />
              </Suspense>
            }
          />
          <Route
            path="orders/:orderNumber"
            element={
              <Suspense fallback={<AdminLoadingFallback />}>
                <AdminOrderDetailPage />
              </Suspense>
            }
          />
          <Route
            path="customers"
            element={
              <Suspense fallback={<AdminLoadingFallback />}>
                <AdminCustomersPage />
              </Suspense>
            }
          />
          <Route
            path="items"
            element={
              <Suspense fallback={<AdminLoadingFallback />}>
                <AdminItemsPage />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}
