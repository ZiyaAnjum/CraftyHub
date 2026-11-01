import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  Check,
  Film,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  Clock,
  ArrowRight,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  Phone,
  Layers,
  Send,
  CheckCircle2
} from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { cleanWhatsAppNumber, getOrderWhatsAppUrl } from '../lib/whatsapp';
import { getSafeNextPath } from '../lib/safeNext';

export const isHttpUrl = (val) => {
  if (typeof val !== 'string' || !val.trim()) return false;
  try {
    const p = new URL(val.trim());
    return p.protocol === 'http:' || p.protocol === 'https:';
  } catch {
    return false;
  }
};

export function VideoOrderModal({ isOpen, onClose, template }) {
  const { user, resendVerification } = useAuth();
  const navigate = useNavigate();

  const modalRef = useRef(null);
  const firstInputRef = useRef(null);

  const storageKey = template ? `fouzas_video_order_${template._id || template.id}` : null;

  // Form State
  const [customizationType, setCustomizationType] = useState('same');
  const [customizationNotes, setCustomizationNotes] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [onScreenText, setOnScreenText] = useState('');
  const [assetLinks, setAssetLinks] = useState(['']);
  const [musicPreference, setMusicPreference] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');

  // Validation & Error states
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Email verification resend state
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendNotice, setResendNotice] = useState(null);

  // Placed order success state
  const [placedOrder, setPlacedOrder] = useState(null);

  const triggerRef = useRef(null);

  // Today's date in YYYY-MM-DD for min date attribute
  const todayStr = new Date().toISOString().split('T')[0];

  // Store trigger button on open
  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement;
    }
  }, [isOpen]);

  // Restore form from sessionStorage on mount / template load (NEVER restoring phone)
  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') return;
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.customizationType) setCustomizationType(parsed.customizationType);
        if (parsed.customizationNotes) setCustomizationNotes(parsed.customizationNotes);
        if (parsed.eventDate) setEventDate(parsed.eventDate);
        if (parsed.onScreenText) setOnScreenText(parsed.onScreenText);
        if (Array.isArray(parsed.assetLinks) && parsed.assetLinks.length > 0) {
          setAssetLinks(parsed.assetLinks);
        }
        if (parsed.musicPreference) setMusicPreference(parsed.musicPreference);
      }
    } catch {
      // Ignore sessionStorage parsing errors
    }
  }, [storageKey]);

  // Persist form to sessionStorage on any change (NEVER storing phone)
  useEffect(() => {
    if (!storageKey || typeof window === 'undefined' || placedOrder) return;
    try {
      const dataToSave = {
        customizationType,
        customizationNotes,
        eventDate,
        onScreenText,
        assetLinks,
        musicPreference,
      };
      sessionStorage.setItem(storageKey, JSON.stringify(dataToSave));
    } catch {
      // Ignore quota errors
    }
  }, [
    storageKey,
    customizationType,
    customizationNotes,
    eventDate,
    onScreenText,
    assetLinks,
    musicPreference,
    placedOrder,
  ]);

  // Handle mobile back button closing the modal
  useEffect(() => {
    if (!isOpen) return;

    window.history.pushState({ fcModal: 'videoOrder' }, '');

    const handlePopState = () => {
      onClose();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (window.history.state?.fcModal === 'videoOrder') {
        window.history.back();
      }
    };
  }, [isOpen, onClose]);

  // Handle body scroll locking, Escape key, and returning focus to trigger
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Focus first input
    const timer = setTimeout(() => {
      firstInputRef.current?.focus();
    }, 100);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
      triggerRef.current?.focus();
    };
  }, [isOpen, onClose]);

  // Add asset link row
  const handleAddAssetLink = () => {
    if (assetLinks.length >= 10) return;
    setAssetLinks((prev) => [...prev, '']);
  };

  // Remove asset link row
  const handleRemoveAssetLink = (index) => {
    setAssetLinks((prev) => prev.filter((_, i) => i !== index));
    if (fieldErrors[`assetLink_${index}`]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[`assetLink_${index}`];
        return next;
      });
    }
  };

  // Change asset link value
  const handleAssetLinkChange = (index, value) => {
    setAssetLinks((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    if (fieldErrors[`assetLink_${index}`]) {
      setFieldErrors((prev) => ({ ...prev, [`assetLink_${index}`]: null }));
    }
  };

  // Client-side validation matching server limits exactly
  const validate = () => {
    const errors = {};

    // Customization notes required if "changes"
    if (customizationType === 'changes') {
      const notes = customizationNotes.trim();
      if (!notes || notes.length < 3) {
        errors.customizationNotes = 'Please describe your desired changes (at least 3 characters).';
      } else if (notes.length > 2000) {
        errors.customizationNotes = 'Customization notes cannot exceed 2000 characters.';
      }
    }

    // On-screen text
    const text = onScreenText.trim();
    if (!text || text.length < 3) {
      errors.onScreenText = 'Please provide your event names, dates, and details (at least 3 characters).';
    } else if (text.length > 2000) {
      errors.onScreenText = 'On-screen text details cannot exceed 2000 characters.';
    }

    // Event date (optional, but no past dates)
    if (eventDate) {
      const d = new Date(eventDate);
      if (isNaN(d.getTime())) {
        errors.eventDate = 'Event date must be a valid date.';
      } else if (eventDate < todayStr) {
        errors.eventDate = 'Event date cannot be in the past.';
      }
    }

    // Asset links: check validity of any non-empty entries
    const nonEmptyLinks = assetLinks.filter((l) => Boolean(l && l.trim()));
    if (nonEmptyLinks.length > 10) {
      errors.assetLinks = 'Maximum 10 asset links are allowed.';
    }
    assetLinks.forEach((link, idx) => {
      const trimmed = link.trim();
      if (trimmed && !isHttpUrl(trimmed)) {
        errors[`assetLink_${idx}`] = 'Must be a valid HTTP or HTTPS link (e.g. https://drive.google.com/...)';
      }
    });

    // Music preference max 500
    if (musicPreference.trim().length > 500) {
      errors.musicPreference = 'Music preference notes cannot exceed 500 characters.';
    }

    // Phone validation if profile has no phone
    if (!user?.phone) {
      const clean = cleanWhatsAppNumber(phone);
      if (!clean || clean.length !== 10 || !/^[6-9]\d{9}$/.test(clean)) {
        errors.phone = 'Please enter a valid 10-digit Indian mobile number.';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Resend email verification
  const handleResendVerification = async () => {
    if (!user?.email || resendingEmail) return;
    setResendingEmail(true);
    setResendNotice(null);
    try {
      const res = await resendVerification(user.email);
      setResendNotice(res?.message || 'Verification link sent! Please check your inbox.');
    } catch (err) {
      setResendNotice(err.message || 'Failed to send verification link.');
    } finally {
      setResendingEmail(false);
    }
  };

  // Submit video order
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setFormError(null);
    setFieldErrors({});

    // Check signed-in state
    if (!user) {
      const target = `/templates/${encodeURIComponent(template.slug)}?order=true`;
      const safeTarget = getSafeNextPath(target);
      navigate(`/signin?next=${encodeURIComponent(safeTarget)}`);
      return;
    }

    // Check email verification
    if (!user.emailVerified) {
      setFormError(
        'Please verify your email address before placing an order. A verification link was sent to your email.'
      );
      return;
    }

    if (!validate()) {
      return;
    }

    setSubmitting(true);

    try {
      const validLinks = assetLinks.map((l) => l.trim()).filter(Boolean);
      const cleanPhone = !user?.phone ? cleanWhatsAppNumber(phone) : user.phone;

      const payload = {
        orderType: 'video',
        templateId: template._id || template.id,
        customizationType,
        customizationNotes: customizationType === 'changes' ? customizationNotes.trim() : '',
        onScreenText: onScreenText.trim(),
        eventDate: eventDate ? new Date(eventDate).toISOString() : null,
        assetLinks: validLinks,
        musicPreference: musicPreference.trim(),
        deliveryType: 'digital',
        phone: cleanPhone,
        customer: {
          name: user.name || 'Valued Customer',
          phone: cleanPhone,
          address: 'Digital Delivery',
        },
      };

      const result = await api.post('/api/orders', payload);

      // Order successfully placed!
      setPlacedOrder(result.order);

      // Clear draft from sessionStorage
      if (storageKey) {
        sessionStorage.removeItem(storageKey);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          const duplicateOrderNum = err.data?.order?.orderNumber || '';
          if (duplicateOrderNum) {
            setFormError(
              `An order with these exact details was just placed as #${duplicateOrderNum}. Please check "My Orders" to track your video creation.`
            );
          } else {
            setFormError(
              'A video order with these exact details was just placed. Please check "My Orders" to track your video creation.'
            );
          }
        } else if (err.data?.code === 'EMAIL_NOT_VERIFIED' || err.status === 403) {
          setFormError('Please verify your email address before placing an order.');
        } else if (Array.isArray(err.details) && err.details.length > 0) {
          const mapped = {};
          err.details.forEach((d) => {
            mapped[d.field] = d.message;
          });
          setFieldErrors(mapped);
        } else {
          setFormError(err.message || 'Unable to place order. Please review details.');
        }
      } else {
        setFormError('Network error. Please check your connection and try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-order-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 md:p-6"
    >
      <motion.div
        ref={modalRef}
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative bg-white w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-2xl rounded-none sm:rounded-3xl shadow-2xl border border-blush-100 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 sm:px-7 py-4 sm:py-5 border-b border-blush-100 flex items-center justify-between bg-cream-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blush-100 text-rose-700 flex items-center justify-center shrink-0">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 id="video-order-modal-title" className="font-serif text-lg sm:text-xl font-bold text-stone-900 leading-tight">
                {placedOrder ? 'Order Confirmed!' : 'Customize Video Invitation'}
              </h2>
              <p className="text-xs text-stone-500 truncate max-w-xs sm:max-w-md">
                {template?.title}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close customization drawer"
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors tap-target"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {/* ==================================================== */}
          {/* CASE 1: SUCCESS CONFIRMATION SCREEN                   */}
          {/* ==================================================== */}
          {placedOrder ? (
            <div className="py-6 sm:py-8 text-center space-y-6 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-soft">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-2">
                <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                  Order Received
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
                  Thank You for Your Order!
                </h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                  Your video order <strong className="text-stone-900">#{placedOrder.orderNumber}</strong> has been placed. We'll review your details and send you a draft preview within ~{template?.deliveryDays || 2} days.
                </p>
              </div>

              {/* Order Info Card */}
              <div className="p-4 rounded-2xl bg-cream-50 border border-blush-200 text-left space-y-2 text-xs text-stone-700">
                <div className="flex justify-between border-b border-blush-100 pb-1.5">
                  <span className="text-stone-500">Order Number:</span>
                  <span className="font-mono font-bold text-blush-700">#{placedOrder.orderNumber}</span>
                </div>
                <div className="flex justify-between border-b border-blush-100 pb-1.5">
                  <span className="text-stone-500">Video Template:</span>
                  <span className="font-semibold text-stone-900 truncate max-w-[200px]">
                    {template?.title}
                  </span>
                </div>
                <div className="flex justify-between border-b border-blush-100 pb-1.5">
                  <span className="text-stone-500">Customization:</span>
                  <span className="font-semibold text-stone-900">
                    {placedOrder.customizationType === 'changes' ? 'With Slight Changes' : 'Same as Template'}
                  </span>
                </div>
                <div className="flex justify-between pt-0.5">
                  <span className="text-stone-500">Delivery Type:</span>
                  <span className="font-semibold text-stone-900">Digital Drive Link (Full HD 1080p)</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <a
                  href={getOrderWhatsAppUrl(placedOrder, 'confirm')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md flex items-center justify-center gap-2 transition-all tap-target"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat with Creator on WhatsApp</span>
                </a>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <Link
                    to="/orders"
                    className="flex-1 py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm text-center shadow-soft transition-all tap-target"
                  >
                    View in My Orders
                  </Link>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 px-4 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-sm transition-all tap-target"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ==================================================== */
            /* CASE 2: CUSTOMIZATION ORDER FORM                     */
            /* ==================================================== */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Top Banner: Starting Price & Artisan Quote Notice */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-cream-100 to-blush-50 border border-blush-200 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-gold-600 shrink-0 mt-0.5" />
                <div className="text-xs text-stone-700 space-y-1">
                  <p className="font-semibold text-stone-900 text-sm">
                    Starting from ₹{Number(template?.basePrice || 0).toLocaleString('en-IN')}
                  </p>
                  <p className="text-stone-600 leading-relaxed">
                    Final price is confirmed by us after reviewing your requirements. Standard turnaround: ~{template?.deliveryDays || 2} days.
                  </p>
                </div>
              </div>

              {/* Global Error Banner */}
              {formError && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-800 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                  {user && !user.emailVerified && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleResendVerification}
                        disabled={resendingEmail}
                        className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-semibold text-xs hover:bg-rose-700 transition-colors tap-target"
                      >
                        {resendingEmail ? 'Sending...' : 'Resend Verification Link'}
                      </button>
                      {resendNotice && <p className="mt-1 text-xs text-rose-900">{resendNotice}</p>}
                    </div>
                  )}
                </div>
              )}

              {/* 1. Customization Mode Selection */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                  Customization Style <span className="text-rose-600">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Option A: Same as template */}
                  <button
                    type="button"
                    onClick={() => setCustomizationType('same')}
                    className={`p-4 rounded-2xl border text-left flex flex-col justify-between gap-2 transition-all tap-target ${
                      customizationType === 'same'
                        ? 'border-rose-600 bg-rose-50/50 shadow-xs ring-1 ring-rose-600'
                        : 'border-stone-200 hover:border-stone-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-semibold text-stone-900 text-sm">Same as template</span>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          customizationType === 'same'
                            ? 'border-rose-600 bg-rose-600 text-white'
                            : 'border-stone-300'
                        }`}
                      >
                        {customizationType === 'same' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                    </div>
                    <p className="text-xs text-stone-500 leading-relaxed">
                      Only replace names, date, venue, and photos. Layout and animation match the preview.
                    </p>
                  </button>

                  {/* Option B: With slight changes */}
                  <button
                    type="button"
                    onClick={() => setCustomizationType('changes')}
                    className={`p-4 rounded-2xl border text-left flex flex-col justify-between gap-2 transition-all tap-target ${
                      customizationType === 'changes'
                        ? 'border-rose-600 bg-rose-50/50 shadow-xs ring-1 ring-rose-600'
                        : 'border-stone-200 hover:border-stone-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-semibold text-stone-900 text-sm">With slight changes</span>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          customizationType === 'changes'
                            ? 'border-rose-600 bg-rose-600 text-white'
                            : 'border-stone-300'
                        }`}
                      >
                        {customizationType === 'changes' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                    </div>
                    <p className="text-xs text-stone-500 leading-relaxed">
                      Adjust colors, audio timing, rearrange text blocks, or add extra custom slides.
                    </p>
                  </button>
                </div>
              </div>

              {/* 2. Customization Notes (Conditional for 'changes') */}
              {customizationType === 'changes' && (
                <div className="space-y-1.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <label htmlFor="customization-notes-input" className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                      Describe Your Desired Changes <span className="text-rose-600">*</span>
                    </label>
                    <span className="text-[11px] text-stone-400">{customizationNotes.length}/2000</span>
                  </div>
                  <textarea
                    id="customization-notes-input"
                    rows={3}
                    maxLength={2000}
                    value={customizationNotes}
                    onChange={(e) => {
                      setCustomizationNotes(e.target.value);
                      if (fieldErrors.customizationNotes) {
                        setFieldErrors((prev) => ({ ...prev, customizationNotes: null }));
                      }
                    }}
                    placeholder="E.g., Please change the accent colors to emerald green, add a bride & groom portrait on slide 2, and use an acoustic flute track..."
                    aria-invalid={Boolean(fieldErrors.customizationNotes)}
                    className={`w-full p-3.5 rounded-2xl bg-white border text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-200 transition-all ${
                      fieldErrors.customizationNotes
                        ? 'border-rose-500 focus:border-rose-500'
                        : 'border-stone-200 focus:border-rose-500'
                    }`}
                  />
                  {fieldErrors.customizationNotes && (
                    <p className="text-xs text-rose-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.customizationNotes}</span>
                    </p>
                  )}
                </div>
              )}

              {/* 3. On-Screen Text & Event Details */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="on-screen-text-input" className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                    On-Screen Text & Names <span className="text-rose-600">*</span>
                  </label>
                  <span className="text-[11px] text-stone-400">{onScreenText.length}/2000</span>
                </div>
                <textarea
                  id="on-screen-text-input"
                  ref={firstInputRef}
                  rows={4}
                  maxLength={2000}
                  value={onScreenText}
                  onChange={(e) => {
                    setOnScreenText(e.target.value);
                    if (fieldErrors.onScreenText) {
                      setFieldErrors((prev) => ({ ...prev, onScreenText: null }));
                    }
                  }}
                  placeholder={`Bride: Fatima Zahra\nGroom: Mohammed Rayan\nEvent: Nikah & Reception\nDate: 24th December 2026\nVenue: Leela Palace, Bengaluru\nFamily Inscriptions: Best wishes from Khan & Ahmed families`}
                  aria-invalid={Boolean(fieldErrors.onScreenText)}
                  className={`w-full p-3.5 rounded-2xl bg-white border text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-200 transition-all ${
                    fieldErrors.onScreenText
                      ? 'border-rose-500 focus:border-rose-500'
                      : 'border-stone-200 focus:border-rose-500'
                  }`}
                />
                {fieldErrors.onScreenText && (
                  <p className="text-xs text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.onScreenText}</span>
                  </p>
                )}
                <p className="text-[11px] text-stone-500">
                  Please double-check spellings for names and venue details.
                </p>
              </div>

              {/* 4. Event Date */}
              <div className="space-y-1.5">
                <label htmlFor="event-date-input" className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                  Event Date <span className="text-stone-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="event-date-input"
                    type="date"
                    min={todayStr}
                    value={eventDate}
                    onChange={(e) => {
                      setEventDate(e.target.value);
                      if (fieldErrors.eventDate) {
                        setFieldErrors((prev) => ({ ...prev, eventDate: null }));
                      }
                    }}
                    aria-invalid={Boolean(fieldErrors.eventDate)}
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-white border text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-200 transition-all ${
                      fieldErrors.eventDate
                        ? 'border-rose-500 focus:border-rose-500'
                        : 'border-stone-200 focus:border-rose-500'
                    }`}
                  />
                </div>
                {fieldErrors.eventDate && (
                  <p className="text-xs text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.eventDate}</span>
                  </p>
                )}
              </div>

              {/* 5. Cloud Asset Links (Google Drive / Dropbox) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                    Photo & Asset Links <span className="text-stone-400 font-normal">(Up to 10)</span>
                  </label>
                  <span className="text-[11px] text-stone-400">{assetLinks.length}/10</span>
                </div>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  Provide Google Drive or Dropbox links for high-res portrait photos. Please ensure link permissions are set to <strong className="text-stone-700">"Anyone with the link can view"</strong>.
                </p>

                <div className="space-y-2">
                  {assetLinks.map((link, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="url"
                          value={link}
                          onChange={(e) => handleAssetLinkChange(idx, e.target.value)}
                          placeholder="https://drive.google.com/drive/folders/..."
                          aria-label={`Asset Link ${idx + 1}`}
                          aria-invalid={Boolean(fieldErrors[`assetLink_${idx}`])}
                          className={`flex-1 px-3.5 py-2 rounded-xl bg-white border text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-200 transition-all ${
                            fieldErrors[`assetLink_${idx}`]
                              ? 'border-rose-500 focus:border-rose-500'
                              : 'border-stone-200 focus:border-rose-500'
                          }`}
                        />
                        {assetLinks.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveAssetLink(idx)}
                            aria-label={`Remove asset link ${idx + 1}`}
                            className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors tap-target shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      {fieldErrors[`assetLink_${idx}`] && (
                        <p className="text-[11px] text-rose-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{fieldErrors[`assetLink_${idx}`]}</span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {assetLinks.length < 10 && (
                  <button
                    type="button"
                    onClick={handleAddAssetLink}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-stone-300 hover:border-rose-400 text-xs font-semibold text-stone-600 hover:text-rose-600 transition-colors tap-target"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Another Link</span>
                  </button>
                )}
              </div>

              {/* 6. Music Preference */}
              <div className="space-y-1.5">
                <label htmlFor="music-preference-input" className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                  Audio / Music Track Preference <span className="text-stone-400 font-normal">(Optional)</span>
                </label>
                <input
                  id="music-preference-input"
                  type="text"
                  maxLength={500}
                  value={musicPreference}
                  onChange={(e) => setMusicPreference(e.target.value)}
                  placeholder="E.g., Keep template music, or use acoustic instrumental version of..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-stone-200 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition-all"
                />
              </div>

              {/* 7. Phone Number (Shown only if profile has no phone) */}
              {!user?.phone ? (
                <div className="space-y-1.5 p-4 rounded-2xl bg-cream-50 border border-blush-200">
                  <label htmlFor="phone-input" className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                    Contact Phone Number <span className="text-rose-600">*</span>
                  </label>
                  <p className="text-[11px] text-stone-500">
                    Needed to coordinate draft reviews and WhatsApp notifications.
                  </p>
                  <div className="relative mt-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-medium">
                      +91
                    </span>
                    <input
                      id="phone-input"
                      type="tel"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value.replace(/\D/g, ''));
                        if (fieldErrors.phone) {
                          setFieldErrors((prev) => ({ ...prev, phone: null }));
                        }
                      }}
                      placeholder="9876543210"
                      aria-invalid={Boolean(fieldErrors.phone)}
                      className={`w-full pl-12 pr-3.5 py-2.5 rounded-xl bg-white border text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-200 transition-all ${
                        fieldErrors.phone
                          ? 'border-rose-500 focus:border-rose-500'
                          : 'border-stone-200 focus:border-rose-500'
                      }`}
                    />
                  </div>
                  {fieldErrors.phone && (
                    <p className="text-xs text-rose-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.phone}</span>
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-[11px] text-stone-500 flex items-center gap-1.5 px-1">
                  <Phone className="w-3.5 h-3.5 text-stone-400" />
                  <span>WhatsApp updates will be sent to your profile phone (+91 {user.phone}).</span>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-2 border-t border-stone-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:text-stone-900 text-sm font-semibold transition-colors tap-target"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-blush-600 hover:from-rose-700 hover:to-blush-700 text-white font-semibold text-sm shadow-rose-glow flex items-center gap-2 transition-all disabled:opacity-60 tap-target"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span>Place Video Order</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
