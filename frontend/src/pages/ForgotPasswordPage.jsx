import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Gift, Mail, AlertCircle, ArrowLeft, CheckCircle2, Clock } from 'lucide-react';

export function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(trimmed);
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Unable to process your request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-blush-100 shadow-soft">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blush-50 text-blush-600 mb-3 shadow-2xs">
            <Gift className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
            Reset Password
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1.5 max-w-xs mx-auto">
            {submitted
              ? 'Check your email for instructions to reset your password.'
              : 'Enter the email address associated with your account and we will send you a reset link.'}
          </p>
        </div>

        {submitted ? (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-emerald-900 text-xs sm:text-sm space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Reset link dispatched</span>
              </div>
              <p className="text-emerald-800 text-xs leading-relaxed">
                If an account exists for <strong className="font-medium text-emerald-950">{email}</strong>, a secure password reset link has been generated.
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 pt-1">
                <Clock className="w-3.5 h-3.5" />
                <span>The link is valid for 1 hour.</span>
              </div>
            </div>

            <p className="text-xs text-stone-500 text-center">
              Did not receive the email? Check your spam/promotions folder, or request another link below.
            </p>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setEmail('');
                }}
                className="w-full py-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs sm:text-sm font-semibold transition-colors"
              >
                Send to a different email
              </button>

              <Link
                to="/signin"
                className="w-full py-2.5 rounded-xl bg-blush-600 hover:bg-blush-700 text-white text-xs sm:text-sm font-semibold text-center transition-colors shadow-soft"
              >
                Return to Sign In
              </Link>
            </div>
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
                htmlFor="forgot-email"
                className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm bg-cream-50/50 focus:bg-white border-stone-200 focus:border-blush-400 focus:ring-1 focus:ring-blush-200 transition-colors"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blush-500 to-blush-600 hover:from-blush-600 hover:to-blush-700 disabled:opacity-70 text-white font-semibold text-sm shadow-soft transition-all flex items-center justify-center gap-2 tap-target"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating reset link...</span>
                </span>
              ) : (
                <span>Send Reset Link</span>
              )}
            </button>

            <div className="text-center pt-2">
              <Link
                to="/signin"
                className="inline-flex items-center gap-1.5 text-xs text-stone-600 hover:text-blush-700 font-medium transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
