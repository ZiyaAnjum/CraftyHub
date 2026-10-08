import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api';
import { ShieldCheck, Mail, Lock, AlertCircle, ArrowRight, Loader2, Sparkles } from 'lucide-react';

export function AdminLoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, login, logout } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(
    searchParams.get('error') === 'unauthorized'
      ? 'Administrator privileges are required to access this portal.'
      : null
  );

  // If already logged in as admin, redirect to admin items
  useEffect(() => {
    if (user && user.role === 'admin') {
      navigate('/admin/items', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please enter both admin email and password.');
      return;
    }

    setLoading(true);
    try {
      const loggedUser = await login({
        email: email.trim().toLowerCase(),
        password,
      });

      if (loggedUser?.role !== 'admin') {
        await logout();
        setError('Access denied: this account does not possess administrator permissions.');
        return;
      }

      navigate('/admin/items', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || 'Invalid administrator credentials.');
      } else {
        setError('Failed to sign in. Please verify your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-100 via-cream-50 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-blush-600 to-gold-400 items-center justify-center text-white shadow-soft mb-4">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-stone-900">
          Fouzas Creation
        </h1>
        <p className="mt-2 text-sm text-stone-500">
          Administrator Control Panel
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-elevated rounded-3xl border border-stone-200/80">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200/80 flex items-start gap-3 text-rose-800 text-xs sm:text-sm animate-in fade-in-50">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@fouzascreation.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 text-stone-800 text-sm focus:outline-none focus:border-blush-500 focus:ring-2 focus:ring-blush-200 transition-all bg-cream-50/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 text-stone-800 text-sm focus:outline-none focus:border-blush-500 focus:ring-2 focus:ring-blush-200 transition-all bg-cream-50/30"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm text-white bg-blush-600 hover:bg-blush-700 active:bg-blush-800 disabled:opacity-50 transition-all shadow-soft"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In as Admin</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-stone-100 text-center">
            <Link
              to="/"
              className="text-xs text-stone-500 hover:text-stone-800 font-medium transition-colors"
            >
              &larr; Return to Public Storefront
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
