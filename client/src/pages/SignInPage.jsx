import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api';
import { getSafeNextPath } from '../lib/safeNext';
import { Gift, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';

export function SignInPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const nextPath = getSafeNextPath(searchParams.get('next'));

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const validate = () => {
    const errors = {};
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Enter a valid email address';
    }
    if (!password) {
      errors.password = 'Password is required';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validate()) return;

    setLoading(true);
    try {
      await login({
        email: email.trim().toLowerCase(),
        password,
      });
      // Redirect safely back to next page (e.g. /create or /orders)
      navigate(nextPath, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        if (Array.isArray(err.details) && err.details.length > 0) {
          const map = {};
          err.details.forEach((d) => {
            map[d.field] = d.message;
          });
          setFieldErrors(map);
        } else {
          setGeneralError(err.message);
        }
      } else {
        setGeneralError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-3 group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blush-500 to-gold-400 text-white flex items-center justify-center shadow-soft group-hover:scale-105 transition-transform">
              <Gift className="w-5 h-5" />
            </div>
            <span className="font-serif text-2xl font-bold text-stone-900 tracking-tight">
              Fouzas Creation
            </span>
          </Link>
          <h1 className="font-serif text-2xl font-bold text-stone-900">Welcome Back</h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Sign in to track orders and customize your gifts
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blush-100 shadow-soft">
          {generalError && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{generalError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="signin-email"
                className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="signin-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: null }));
                  }}
                  placeholder="name@example.com"
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm bg-cream-50/50 focus:bg-white transition-colors ${
                    fieldErrors.email
                      ? 'border-rose-400 focus:border-rose-500 ring-1 ring-rose-200'
                      : 'border-stone-200 focus:border-blush-400'
                  }`}
                  required
                />
              </div>
              {fieldErrors.email && (
                <p className="text-[11px] text-rose-600 mt-1 pl-1">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="signin-password"
                className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="signin-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: null }));
                  }}
                  placeholder="••••••••••••"
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm bg-cream-50/50 focus:bg-white transition-colors ${
                    fieldErrors.password
                      ? 'border-rose-400 focus:border-rose-500 ring-1 ring-rose-200'
                      : 'border-stone-200 focus:border-blush-400'
                  }`}
                  required
                />
              </div>
              {fieldErrors.password && (
                <p className="text-[11px] text-rose-600 mt-1 pl-1">{fieldErrors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-blush-500 to-blush-600 hover:from-blush-600 hover:to-blush-700 disabled:opacity-70 text-white font-semibold text-sm shadow-soft transition-all flex items-center justify-center gap-2 tap-target"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-stone-100 text-center">
            <p className="text-xs text-stone-500">
              Don't have an account yet?{' '}
              <Link
                to={`/signup?next=${encodeURIComponent(nextPath)}`}
                className="font-semibold text-blush-600 hover:text-blush-700 underline underline-offset-2"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
