import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  LogOut,
  Package,
  Gift,
  Sparkles,
  ChevronRight,
  Edit3,
  Check,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export function AccountPage() {
  const { user, logout, updateProfile, resendVerification } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  // Edit Profile State (F-94)
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [savedAddress, setSavedAddress] = useState(user?.savedAddress || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Email verification resend state (F-95)
  const [resendingVerification, setResendingVerification] = useState(false);
  const [verificationNotice, setVerificationNotice] = useState(null);

  const handleResendVerification = async () => {
    if (!user?.email || resendingVerification) return;
    setResendingVerification(true);
    setVerificationNotice(null);
    try {
      const res = await resendVerification(user.email);
      setVerificationNotice(res.message || 'Verification link sent to your email.');
      setTimeout(() => setVerificationNotice(null), 5000);
    } catch (err) {
      setVerificationNotice(err.message || 'Failed to send verification email.');
    } finally {
      setResendingVerification(false);
    }
  };

  const handleStartEdit = () => {
    setName(user?.name || '');
    setPhone(user?.phone || '');
    setSavedAddress(user?.savedAddress || '');
    setError(null);
    setSuccess(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setError(null);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setError('Name must be at least 2 characters long');
      return;
    }
    if (trimmedName.length > 80) {
      setError('Name cannot exceed 80 characters');
      return;
    }

    const trimmedPhone = phone.trim();
    if (!/^[6-9]\d{9}$/.test(trimmedPhone)) {
      setError('Please enter a valid 10-digit Indian mobile number starting with 6-9');
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        name: trimmedName,
        phone: trimmedPhone,
        savedAddress: savedAddress.trim(),
      });
      setIsEditing(false);
      setSuccess('Profile details successfully updated!');
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

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
          Manage your contact details, saved address, and active gift orders.
        </p>
      </div>

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blush-100 shadow-soft space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 pb-6 border-b border-stone-100 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blush-500 to-gold-400 text-white flex items-center justify-center text-2xl font-serif font-bold shadow-soft">
              {user.name ? user.name[0].toUpperCase() : 'U'}
            </div>

            <div>
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

          {!isEditing && (
            <button
              onClick={handleStartEdit}
              className="px-4 py-2 rounded-xl border border-blush-200 text-blush-700 hover:bg-blush-50 text-xs font-semibold flex items-center gap-1.5 transition-colors tap-target self-center sm:self-auto"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>

        {/* Profile Details or Edit Form */}
        {isEditing ? (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="edit-name" className="block text-xs font-semibold text-stone-700 mb-1">
                Full Name *
              </label>
              <input
                id="edit-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blush-400 focus:border-transparent transition-all"
                placeholder="e.g. Priya Sharma"
              />
            </div>

            <div>
              <label htmlFor="edit-email" className="block text-xs font-semibold text-stone-700 mb-1">
                Email Address (Account identifier)
              </label>
              <input
                id="edit-email"
                type="email"
                value={user.email}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-500 text-sm cursor-not-allowed"
              />
              <span className="text-[11px] text-stone-400 mt-0.5 block">
                Email address cannot be changed directly.
              </span>
            </div>

            <div>
              <label htmlFor="edit-phone" className="block text-xs font-semibold text-stone-700 mb-1">
                Mobile Number (India, 10 digits) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-stone-400 font-medium select-none">
                  +91
                </span>
                <input
                  id="edit-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  maxLength={10}
                  required
                  className="w-full pl-12 pr-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blush-400 focus:border-transparent transition-all"
                  placeholder="9876543210"
                />
              </div>
            </div>

            <div>
              <label htmlFor="edit-address" className="block text-xs font-semibold text-stone-700 mb-1">
                Saved Delivery Address
              </label>
              <textarea
                id="edit-address"
                rows={3}
                value={savedAddress}
                onChange={(e) => setSavedAddress(e.target.value)}
                maxLength={500}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blush-400 focus:border-transparent transition-all resize-none"
                placeholder="Flat / House No., Street, Landmark, Bengaluru, 560001"
              />
              <span className="text-[11px] text-stone-400 mt-0.5 block">
                Auto-fills in your future bespoke order enquiries.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={saving}
                className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-blush-600 hover:bg-blush-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Contact & Address Info */
          <div className="space-y-3.5">
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-cream-50/70 border border-stone-100">
              <Mail className="w-5 h-5 text-blush-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-[11px] uppercase tracking-wider text-stone-400 block font-semibold">
                  Email Address
                </span>
                <p className="text-sm text-stone-800 font-medium truncate">{user.email}</p>
              </div>
              {user.emailVerified ? (
                <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified
                </span>
              ) : (
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                    Pending Verification
                  </span>
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendingVerification}
                    className="text-[11px] text-blush-600 hover:text-blush-700 underline font-medium"
                  >
                    {resendingVerification ? 'Sending link...' : 'Resend link'}
                  </button>
                </div>
              )}
            </div>

            {verificationNotice && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                {verificationNotice}
              </div>
            )}

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

            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-cream-50/70 border border-stone-100">
              <MapPin className="w-5 h-5 text-blush-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <span className="text-[11px] uppercase tracking-wider text-stone-400 block font-semibold">
                  Saved Delivery Address
                </span>
                {user.savedAddress ? (
                  <p className="text-sm text-stone-800 font-medium whitespace-pre-line">
                    {user.savedAddress}
                  </p>
                ) : (
                  <p className="text-xs text-stone-400 italic">
                    No default delivery address saved yet. Tap "Edit Profile" above to add one.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

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
                  <span className="text-sm font-bold text-purple-950 block">Manage Items Catalogue</span>
                  <span className="text-xs text-purple-700">Add, edit, publish & manage bespoke items</span>
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
