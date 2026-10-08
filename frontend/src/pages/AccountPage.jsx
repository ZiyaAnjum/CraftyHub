import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, ShieldCheck, LogOut, Package, Gift, Sparkles, ChevronRight } from 'lucide-react';

export function AccountPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleSignOut = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/signin', { replace: true });
    } catch {
      // Ignore
    } finally {
      setLoggingOut(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
      <div className="text-center sm:text-left">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
          My Account
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Manage your contact details and active gift orders.
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blush-100 shadow-soft space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-6 border-b border-stone-100 text-center sm:text-left">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blush-500 to-gold-400 text-white flex items-center justify-center text-2xl font-serif font-bold shadow-soft">
            {user.name ? user.name[0].toUpperCase() : 'U'}
          </div>

          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h2 className="font-serif text-xl font-bold text-stone-900">{user.name}</h2>
              {user.role === 'admin' ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 self-center sm:self-auto">
                  Administrator
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cream-200 text-stone-700 self-center sm:self-auto">
                  Customer
                </span>
              )}
            </div>
            <p className="text-xs text-stone-400 mt-0.5">Member since your first special moment</p>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-cream-50/70 border border-stone-100">
            <Mail className="w-5 h-5 text-blush-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-[11px] uppercase tracking-wider text-stone-400 block font-semibold">
                Email Address
              </span>
              <p className="text-sm text-stone-800 font-medium truncate">{user.email}</p>
            </div>
            {user.emailVerified ? (
              <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Verified
              </span>
            ) : (
              <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
                Standard
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-cream-50/70 border border-stone-100">
            <Phone className="w-5 h-5 text-gold-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-[11px] uppercase tracking-wider text-stone-400 block font-semibold">
                Mobile Number (India)
              </span>
              <p className="text-sm text-stone-800 font-medium">
                +91 {user.phone ? `${user.phone.slice(0, 5)} ${user.phone.slice(5)}` : 'Not provided'}
              </p>
            </div>
          </div>
        </div>

        {/* Admin Quick Links */}
        {user.role === 'admin' && (
          <div className="pt-2">
            <Link
              to="/admin/items"
              className="p-4 rounded-2xl border border-purple-200 bg-purple-50/60 hover:bg-purple-100/60 transition-all flex items-center justify-between group tap-target shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-bold text-purple-950 block">Manage Gift Catalog</span>
                  <span className="text-xs text-purple-700">Add, edit, publish & manage gift items</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-purple-400 group-hover:text-purple-700 group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>
        )}

        {/* Quick Links */}
        <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            to="/orders"
            className="p-4 rounded-2xl border border-stone-200 hover:border-blush-200 bg-white hover:bg-blush-50/40 transition-all flex items-center justify-between group tap-target"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blush-50 text-blush-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Package className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold text-stone-800">Track Orders</span>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-blush-600 group-hover:translate-x-0.5 transition-all" />
          </Link>

          <Link
            to="/create"
            className="p-4 rounded-2xl border border-stone-200 hover:border-blush-200 bg-white hover:bg-blush-50/40 transition-all flex items-center justify-between group tap-target"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gold-50 text-gold-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Gift className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold text-stone-800">Design a Gift</span>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-blush-600 group-hover:translate-x-0.5 transition-all" />
          </Link>
        </div>

        {/* Sign out */}
        <div className="pt-4 border-t border-stone-100 flex justify-end">
          <button
            onClick={handleSignOut}
            disabled={loggingOut}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-sm font-semibold transition-colors flex items-center justify-center gap-2 tap-target"
          >
            <LogOut className="w-4 h-4" />
            <span>{loggingOut ? 'Signing out...' : 'Sign out'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
