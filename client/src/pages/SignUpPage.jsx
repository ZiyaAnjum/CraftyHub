import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api';
import { getSafeNextPath } from '../lib/safeNext';
import { Gift, Mail, Lock, User, Phone, AlertCircle, ArrowRight, Check } from 'lucide-react';

export function SignUpPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { register } = useAuth();

  const nextPath = getSafeNextPath(searchParams.get('next'));

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // Client validation matching server zod schemas
  const validateForm = () => {
    const errors = {};

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      errors.name = 'Name must be at least 2 characters';
    } else if (trimmedName.length > 80) {
      errors.name = 'Name must be at most 80 characters';
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Enter a valid email address';
    }

    const trimmedPhone = phone.trim();
    if (!/^[6-9]\d{9}$/.test(trimmedPhone)) {
      errors.phone = 'Enter a valid 10-digit mobile number starting with 6-9';
    }

    if (password.length < 10) {
      errors.password = 'Password must be at least 10 characters';
    } else if (password.length > 72) {
      errors.password = 'Password must be at most 72 characters';
    } else if (!/[A-Za-z]/.test(password)) {
      errors.password = 'Password must contain at least one letter';
    } else if (!/\d/.test(password)) {
      errors.password = 'Password must contain at least one number';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validateForm()) return;

    setLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
      });

      // Redirect safely back to next page (e.g. /create with draft intact)
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
        setGeneralError('Registration failed. Please check your network and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper password checklist indicators
  const hasMinLength = password.length >= 10;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /\d/.test(password);

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
          <h1 className="font-serif text-2xl font-bold text-stone-900">Create an Account</h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Join to save your gift customizations and track all your orders
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
            {/* Full Name */}
            <div>
              <label
                htmlFor="signup-name"
                className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1"
              >
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="signup-name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: null }));
                  }}
                  placeholder="e.g. Ananya Sharma"
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm bg-cream-50/50 focus:bg-white transition-colors ${
                    fieldErrors.name
                      ? 'border-rose-400 focus:border-rose-500 ring-1 ring-rose-200'
                      : 'border-stone-200 focus:border-blush-400'
                  }`}
                  required
                />
              </div>
              {fieldErrors.name && (
                <p className="text-[11px] text-rose-600 mt-1 pl-1">{fieldErrors.name}</p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label
                htmlFor="signup-email"
                className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: null }));
                  }}
                  placeholder="ananya@example.com"
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

            {/* 10-Digit Mobile Number */}
            <div>
              <label
                htmlFor="signup-phone"
                className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1"
              >
                Mobile Number (India)
              </label>
              <div className="relative flex">
                <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-stone-200 bg-stone-100 text-stone-600 text-xs font-medium">
                  +91
                </span>
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <input
                    id="signup-phone"
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setPhone(val);
                      if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: null }));
                    }}
                    placeholder="9876543210"
                    className={`w-full pl-9 pr-3.5 py-2.5 rounded-r-xl border text-sm bg-cream-50/50 focus:bg-white transition-colors ${
                      fieldErrors.phone
                        ? 'border-rose-400 focus:border-rose-500 ring-1 ring-rose-200'
                        : 'border-stone-200 focus:border-blush-400'
                    }`}
                    required
                  />
                </div>
              </div>
              {fieldErrors.phone ? (
                <p className="text-[11px] text-rose-600 mt-1 pl-1">{fieldErrors.phone}</p>
              ) : (
                <p className="text-[10px] text-stone-400 mt-1 pl-1">
                  Used for order confirmation and WhatsApp updates
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="signup-password"
                className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="signup-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: null }));
                  }}
                  placeholder="Min 10 characters, 1 letter, 1 number"
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

              {/* Password Requirements Guidance */}
              <div className="mt-2 p-2.5 rounded-xl bg-stone-50 border border-stone-200/60 space-y-1 text-[11px]">
                <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-700 font-medium' : 'text-stone-400'}`}>
                  <Check className={`w-3.5 h-3.5 ${hasMinLength ? 'text-emerald-500' : 'text-stone-300'}`} />
                  <span>10 to 72 characters</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasLetter ? 'text-emerald-700 font-medium' : 'text-stone-400'}`}>
                  <Check className={`w-3.5 h-3.5 ${hasLetter ? 'text-emerald-500' : 'text-stone-300'}`} />
                  <span>At least one letter (a-z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-700 font-medium' : 'text-stone-400'}`}>
                  <Check className={`w-3.5 h-3.5 ${hasNumber ? 'text-emerald-500' : 'text-stone-300'}`} />
                  <span>At least one number (0-9)</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-3 rounded-xl bg-gradient-to-r from-blush-500 to-blush-600 hover:from-blush-600 hover:to-blush-700 disabled:opacity-70 text-white font-semibold text-sm shadow-soft transition-all flex items-center justify-center gap-2 tap-target"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-stone-100 text-center">
            <p className="text-xs text-stone-500">
              Already have an account?{' '}
              <Link
                to={`/signin?next=${encodeURIComponent(nextPath)}`}
                className="font-semibold text-blush-600 hover:text-blush-700 underline underline-offset-2"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
