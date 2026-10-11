import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, CheckCircle2, AlertCircle, RefreshCw, ArrowRight, Sparkles } from 'lucide-react';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const { user, verifyEmail, resendVerification } = useAuth();

  const [loading, setLoading] = useState(Boolean(token));
  const [verified, setVerified] = useState(Boolean(user?.emailVerified));
  const [error, setError] = useState(null);

  // Resend state
  const [resendEmail, setResendEmail] = useState(user?.email || '');
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState(null);

  useEffect(() => {
    let active = true;

    async function executeVerification() {
      if (!token) return;
      try {
        setLoading(true);
        setError(null);
        await verifyEmail(token.trim());
        if (active) {
          setVerified(true);
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Verification link is invalid or has expired.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    executeVerification();

    return () => {
      active = false;
    };
  }, [token]);

  const handleResend = async (e) => {
    e.preventDefault();
    setResendStatus(null);
    const target = resendEmail.trim().toLowerCase();
    if (!target) return;

    setResending(true);
    try {
      const res = await resendVerification(target);
      setResendStatus(res.message || 'Verification link sent. Please check your inbox.');
    } catch (err) {
      setResendStatus(err.message || 'Failed to send verification link. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white p-8 sm:p-10 rounded-3xl border border-blush-100 shadow-soft text-center">
        {loading ? (
          <div className="space-y-4 py-8">
            <RefreshCw className="w-10 h-10 animate-spin text-blush-600 mx-auto" />
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
              Verifying your email...
            </h1>
            <p className="text-xs sm:text-sm text-stone-500">
              Please wait while we validate your secure token.
            </p>
          </div>
        ) : verified ? (
          <div className="space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center shadow-2xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
                Email Verified!
              </h1>
              <p className="text-xs sm:text-sm text-stone-500 mt-2 leading-relaxed">
                Your email address has been successfully confirmed. You now have full access to submit custom gift requirements, build hampers, and track your orders.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <Link
                to="/create"
                className="w-full py-3 rounded-xl bg-blush-600 hover:bg-blush-700 text-white font-semibold text-xs sm:text-sm shadow-soft transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-gold-300" />
                <span>Place a Custom Order</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/account"
                className="w-full py-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs sm:text-sm font-semibold transition-colors"
              >
                Go to My Account
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6 text-left">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center mb-3">
                <Mail className="w-6 h-6" />
              </div>
              <h1 className="font-serif text-2xl font-bold text-stone-900">
                Email Verification
              </h1>
              <p className="text-xs sm:text-sm text-stone-500 mt-1">
                {error || 'A verification link is required to activate custom order placement.'}
              </p>
            </div>

            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleResend} className="space-y-3 pt-2">
              <label
                htmlFor="resend-email"
                className="block text-xs font-semibold text-stone-700 uppercase tracking-wider"
              >
                Resend Verification Link
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="resend-email"
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-xs sm:text-sm bg-cream-50/50 focus:bg-white border-stone-200 focus:border-blush-400 focus:ring-1 focus:ring-blush-200"
                  required
                />
              </div>

              {resendStatus && (
                <p className="text-xs font-medium text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                  {resendStatus}
                </p>
              )}

              <button
                type="submit"
                disabled={resending}
                className="w-full py-2.5 rounded-xl bg-blush-600 hover:bg-blush-700 text-white font-semibold text-xs sm:text-sm shadow-soft transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {resending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Send New Verification Link</span>
                )}
              </button>
            </form>

            <div className="text-center pt-2">
              <Link
                to="/account"
                className="text-xs text-stone-500 hover:text-stone-800 font-medium"
              >
                Return to Account Overview
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
