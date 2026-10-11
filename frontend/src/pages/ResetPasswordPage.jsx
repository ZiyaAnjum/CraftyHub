import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, AlertCircle, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const validate = () => {
    if (!token.trim()) {
      setError('Missing or invalid reset token. Please request a new reset link.');
      return false;
    }
    if (password.length < 10) {
      setError('Password must be at least 10 characters long.');
      return false;
    }
    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setError('Password must contain at least one letter and one number.');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validate()) return;

    setLoading(true);
    try {
      await resetPassword(token.trim(), password);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-6 bg-white p-8 sm:p-10 rounded-3xl border border-blush-100 shadow-soft text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-stone-900">
            Invalid Reset Link
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
            This password reset link is missing a verification token or has already been used.
          </p>
          <div className="pt-2">
            <Link
              to="/forgot-password"
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blush-600 hover:bg-blush-700 text-white text-xs sm:text-sm font-semibold transition-colors shadow-soft"
            >
              <span>Request a New Reset Link</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-blush-100 shadow-soft">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blush-50 text-blush-600 mb-3 shadow-2xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
            Set New Password
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1.5">
            Choose a strong password of at least 10 characters.
          </p>
        </div>

        {success ? (
          <div className="space-y-6 text-center">
            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-emerald-900 text-xs sm:text-sm space-y-2 text-left">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Password successfully updated</span>
              </div>
              <p className="text-emerald-800 text-xs leading-relaxed">
                Your password has been changed. For your security, any existing sign-in sessions have been terminated.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/signin', { replace: true })}
              className="w-full py-3 rounded-xl bg-blush-600 hover:bg-blush-700 text-white font-semibold text-sm shadow-soft transition-all flex items-center justify-center gap-2"
            >
              <span>Sign in with New Password</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="new-password"
                className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1"
              >
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Min 10 characters, letters & digits"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm bg-cream-50/50 focus:bg-white border-stone-200 focus:border-blush-400 focus:ring-1 focus:ring-blush-200 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1"
              >
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Re-enter password"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm bg-cream-50/50 focus:bg-white border-stone-200 focus:border-blush-400 focus:ring-1 focus:ring-blush-200 transition-colors"
                  required
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-stone-50 border border-stone-100 text-[11px] text-stone-500 space-y-1">
              <div className="font-semibold text-stone-700">Password requirements:</div>
              <ul className="list-disc list-inside space-y-0.5 text-stone-600">
                <li className={password.length >= 10 ? 'text-emerald-600 font-medium' : ''}>
                  At least 10 characters long
                </li>
                <li className={/[A-Za-z]/.test(password) && /\d/.test(password) ? 'text-emerald-600 font-medium' : ''}>
                  Contains both letters and digits
                </li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blush-500 to-blush-600 hover:from-blush-600 hover:to-blush-700 disabled:opacity-70 text-white font-semibold text-sm shadow-soft transition-all flex items-center justify-center gap-2 tap-target"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Updating password...</span>
                </span>
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
