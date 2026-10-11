import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Package,
  Sparkles,
  Gift,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Search,
  RotateCcw,
  Clock,
  Mail,
  RefreshCw,
  Copy,
  Check,
  MessageCircle,
  Calendar,
  MapPin,
  Store,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { getOptimizedImageUrl } from '../lib/images';
import { getTodayKolkataDateString } from '../lib/date';
import { cleanWhatsAppNumber, getShopWhatsAppUrl, getOrderWhatsAppUrl } from '../lib/whatsapp';

const HAMPER_DRAFT_KEY = 'fc_hamper_draft';

export const FALLBACK_BASES = [
  {
    id: 'velvet_trunk',
    name: 'Royal Velvet Keepsake Trunk',
    price: 899,
    description: 'Luxury handcrafted trunk in blush velvet with antique brass clasps and satin lining',
    tag: 'Luxury Tier',
  },
  {
    id: 'wicker_basket',
    name: 'Handwoven Artisanal Wicker Basket',
    price: 499,
    description: 'Natural eco-friendly willow basket with satin ribbon wrapping and floral accents',
    tag: 'Classic Charm',
  },
  {
    id: 'matte_box',
    name: 'Classic Matte Magnetic Gift Box',
    price: 299,
    description: 'Rigid luxury gift box with embossed metallic finish and concealed magnetic flap',
    tag: 'Modern Minimal',
  },
  {
    id: 'wooden_tray',
    name: 'Carved Wooden Presentation Platter',
    price: 399,
    description: 'Rustic solid pine platter with decorative presentation shavings and gold cord',
    tag: 'Artisanal Wood',
  },
];

const MAX_ITEMS_TOTAL = 10;
const MAX_PER_ITEM = 5;

export function HamperBuilderPage() {
  const shouldReduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const { user, loading: authLoading, resendVerification } = useAuth();

  // Load saved draft from storage if present
  const savedDraft = useMemo(() => {
    try {
      const stored = sessionStorage.getItem(HAMPER_DRAFT_KEY) || localStorage.getItem(HAMPER_DRAFT_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, []);

  // Builder state
  const [step, setStep] = useState(savedDraft?.step || 1); // 1: Base, 2: Items, 3: Message & Checkout
  const [bases, setBases] = useState(FALLBACK_BASES);
  const [selectedBaseId, setSelectedBaseId] = useState(savedDraft?.baseId || 'velvet_trunk');
  const [selectedItems, setSelectedItems] = useState(savedDraft?.items || []); // [{ item: id, quantity, title, unitPrice, image }]
  const [giftMessage, setGiftMessage] = useState(savedDraft?.giftMessage || '');
  const [neededByDate, setNeededByDate] = useState(savedDraft?.neededByDate || '');
  const [deliveryType, setDeliveryType] = useState(savedDraft?.deliveryType || 'delivery');
  const [address, setAddress] = useState(savedDraft?.address || '');
  const [phone, setPhone] = useState(savedDraft?.phone || user?.phone || '');
  const [specialNotes, setSpecialNotes] = useState(savedDraft?.specialNotes || '');

  // Catalog items
  const [catalogItems, setCatalogItems] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [placedOrder, setPlacedOrder] = useState(null);
  const [copiedOrder, setCopiedOrder] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [resendVerificationNotice, setResendVerificationNotice] = useState(null);

  const minDateString = getTodayKolkataDateString();

  // 1. Fetch Hamper Bases from server
  useEffect(() => {
    let isMounted = true;
    async function loadBases() {
      try {
        const res = await api.get('/api/builder/hamper-bases');
        if (isMounted && res.bases && res.bases.length > 0) {
          setBases(res.bases);
        }
      } catch {
        // Fallback already pre-set
      }
    }
    loadBases();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch Hamper-Eligible Catalog Items
  useEffect(() => {
    let isMounted = true;
    async function loadCatalog() {
      try {
        setCatalogLoading(true);
        const res = await api.get('/api/items?hamperEligible=true&limit=100');
        if (isMounted) {
          setCatalogItems(res.items || []);
        }
      } catch {
        // Fallback gracefully
      } finally {
        if (isMounted) setCatalogLoading(false);
      }
    }
    loadCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  // 3. Save draft to sessionStorage & localStorage
  useEffect(() => {
    if (placedOrder) return;
    const draftData = {
      step,
      baseId: selectedBaseId,
      items: selectedItems,
      giftMessage,
      neededByDate,
      deliveryType,
      address,
      phone,
      specialNotes,
      lastUpdated: new Date().toISOString(),
    };
    try {
      const serialized = JSON.stringify(draftData);
      sessionStorage.setItem(HAMPER_DRAFT_KEY, serialized);
      localStorage.setItem(HAMPER_DRAFT_KEY, serialized);
    } catch {
      // Ignore quota issues
    }
  }, [step, selectedBaseId, selectedItems, giftMessage, neededByDate, deliveryType, address, phone, specialNotes, placedOrder]);

  // Update phone if user logs in
  useEffect(() => {
    if (user?.phone && !phone) {
      setPhone(user.phone);
    }
  }, [user, phone]);

  // Calculations
  const selectedBase = useMemo(() => {
    return bases.find((b) => b.id === selectedBaseId) || bases[0] || FALLBACK_BASES[0];
  }, [bases, selectedBaseId]);

  const totalItemCount = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [selectedItems]);

  const itemsSubtotal = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }, [selectedItems]);

  const runningTotal = useMemo(() => {
    const basePrice = selectedBase?.price || 0;
    return basePrice + itemsSubtotal;
  }, [selectedBase, itemsSubtotal]);

  // Filtered catalogue items
  const filteredCatalogItems = useMemo(() => {
    return catalogItems.filter((it) => {
      if (categoryFilter !== 'All' && it.category !== categoryFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = (it.title || '').toLowerCase().includes(query);
        const matchesDesc = (it.description || '').toLowerCase().includes(query);
        const matchesTags = (it.occasionTags || []).some((t) => t.toLowerCase().includes(query));
        if (!matchesTitle && !matchesDesc && !matchesTags) return false;
      }
      return true;
    });
  }, [catalogItems, categoryFilter, searchQuery]);

  // Handlers for adding/removing items
  const handleAddItem = (item) => {
    if (totalItemCount >= MAX_ITEMS_TOTAL) {
      setFormError(`Your hamper has reached the maximum capacity of ${MAX_ITEMS_TOTAL} items.`);
      return;
    }

    setFormError(null);
    const existingIndex = selectedItems.findIndex((i) => i.item === item._id || i.item === item.id);
    const unitPrice = item.startingPrice || item.price || 0;

    if (existingIndex >= 0) {
      const existing = selectedItems[existingIndex];
      if (existing.quantity >= MAX_PER_ITEM) {
        setFormError(`You can add at most ${MAX_PER_ITEM} of "${item.title}" to a hamper.`);
        return;
      }
      const updated = [...selectedItems];
      updated[existingIndex] = {
        ...existing,
        quantity: existing.quantity + 1,
      };
      setSelectedItems(updated);
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          item: item._id || item.id,
          title: item.title,
          unitPrice,
          image: item.images?.[0]?.url || '',
          quantity: 1,
        },
      ]);
    }
  };

  const handleDecrementItem = (itemId) => {
    setFormError(null);
    const existingIndex = selectedItems.findIndex((i) => i.item === itemId);
    if (existingIndex < 0) return;

    const existing = selectedItems[existingIndex];
    if (existing.quantity > 1) {
      const updated = [...selectedItems];
      updated[existingIndex] = {
        ...existing,
        quantity: existing.quantity - 1,
      };
      setSelectedItems(updated);
    } else {
      handleRemoveItem(itemId);
    }
  };

  const handleRemoveItem = (itemId) => {
    setFormError(null);
    setSelectedItems(selectedItems.filter((i) => i.item !== itemId));
  };

  const handleClearDraft = () => {
    setSelectedBaseId('velvet_trunk');
    setSelectedItems([]);
    setGiftMessage('');
    setNeededByDate('');
    setAddress('');
    setSpecialNotes('');
    setFormError(null);
    setFieldErrors({});
    setStep(1);
    try {
      sessionStorage.removeItem(HAMPER_DRAFT_KEY);
      localStorage.removeItem(HAMPER_DRAFT_KEY);
    } catch {
      // Ignore
    }
  };

  const handleResendVerification = async () => {
    if (!user?.email || resendingVerification) return;
    setResendingVerification(true);
    setResendVerificationNotice(null);
    try {
      const res = await resendVerification(user.email);
      setResendVerificationNotice(res.message || 'Verification link sent! Please check your inbox.');
    } catch (err) {
      setResendVerificationNotice(err.message || 'Failed to send verification link. Please try again.');
    } finally {
      setResendingVerification(false);
    }
  };

  // Form Validation
  const validateCheckout = () => {
    const errors = {};
    if (selectedItems.length === 0) {
      errors.items = 'Please select at least 1 item for your hamper.';
    }
    if (totalItemCount > MAX_ITEMS_TOTAL) {
      errors.items = `Maximum limit of ${MAX_ITEMS_TOTAL} items per hamper exceeded.`;
    }

    const cleanPhone = cleanWhatsAppNumber(phone);
    if (!cleanPhone || cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      errors.phone = 'Please enter a valid 10-digit Indian mobile number.';
    }

    if (deliveryType === 'delivery') {
      if (!address || address.trim().length < 5) {
        errors.address = 'Please provide a complete delivery address with pincode.';
      }
    }

    if (neededByDate) {
      const d = new Date(neededByDate);
      if (isNaN(d.getTime())) {
        errors.neededByDate = 'Needed-by date must be a valid date';
      } else if (neededByDate < minDateString) {
        errors.neededByDate = 'Needed-by date cannot be in the past';
      }
    }

    if (giftMessage && giftMessage.length > 500) {
      errors.giftMessage = 'Gift card message cannot exceed 500 characters.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Hamper Order
  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (authLoading || submitting) return;

    setFormError(null);
    setFieldErrors({});

    // 1. Require Auth (Preserves draft across sign-in)
    if (!user) {
      navigate('/signin?next=/hamper-builder');
      return;
    }

    // 2. Require Email Verified
    if (!user.emailVerified) {
      setFormError('Please verify your email address before placing an order. A verification link was sent to your email.');
      return;
    }

    if (!validateCheckout()) {
      return;
    }

    setSubmitting(true);

    try {
      const cleanPhone = cleanWhatsAppNumber(phone);
      const deliveryAddress = deliveryType === 'pickup' ? 'pickup' : address.trim();

      const payload = {
        hamper: {
          baseId: selectedBase.id,
          items: selectedItems.map((i) => ({
            item: i.item,
            quantity: i.quantity,
          })),
          giftMessage: giftMessage.trim() || undefined,
        },
        deliveryType,
        address: deliveryAddress,
        neededByDate: neededByDate ? new Date(neededByDate).toISOString() : null,
        requirements: specialNotes.trim() || undefined,
        phone: cleanPhone,
        customer: {
          name: user.name,
          phone: cleanPhone,
          address: deliveryAddress,
        },
      };

      const res = await api.post('/api/orders', payload);
      setPlacedOrder(res.order);

      // Clear draft on successful order
      handleClearDraft();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.data?.code === 'EMAIL_NOT_VERIFIED') {
          setFormError('Please verify your email address before placing an order.');
        } else if (Array.isArray(err.details) && err.details.length > 0) {
          const map = {};
          err.details.forEach((d) => {
            map[d.field] = d.message;
          });
          setFieldErrors(map);
        } else {
          setFormError(err.message);
        }
      } else {
        setFormError('Failed to place hamper order. Please check your connection and try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const copyOrderNumber = () => {
    if (!placedOrder?.orderNumber) return;
    navigator.clipboard?.writeText(placedOrder.orderNumber);
    setCopiedOrder(true);
    setTimeout(() => setCopiedOrder(false), 2000);
  };

  // -------------------------------------------------------------
  // SUCCESS SCREEN
  // -------------------------------------------------------------
  if (placedOrder) {
    const whatsappUrl = getOrderWhatsAppUrl(placedOrder, 'confirm');

    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center space-y-6">
        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-soft"
        >
          <CheckCircle2 className="w-10 h-10" />
        </motion.div>

        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gold-600">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Hamper Request Confirmed</span>
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
            Hamper Order Placed!
          </h1>
          <p className="text-sm text-stone-600 max-w-md mx-auto">
            Thank you, <strong className="text-stone-900">{user?.name}</strong>. Your bespoke hamper creation has been received with server-calculated price verification.
          </p>
        </div>

        {/* Order Reference Pill */}
        <div className="inline-flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-stone-100 border border-stone-200">
          <span className="font-mono text-2xl font-bold text-blush-700 tracking-wider">
            #{placedOrder.orderNumber}
          </span>
          <button
            type="button"
            onClick={copyOrderNumber}
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-white transition-colors tap-target"
            title="Copy order number"
          >
            {copiedOrder ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>

        {/* Itemized Hamper Breakdown Card */}
        <div className="bg-white rounded-3xl border border-blush-100 p-6 text-left shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blush-600" />
              <h3 className="font-serif font-bold text-stone-900 text-base">{hamperBaseName}</h3>
            </div>
            <span className="text-xs font-semibold text-stone-500">
              Base: ₹{placedOrder.hamper?.base?.price || selectedBase.price}
            </span>
          </div>

          {/* Selected Items List */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block">
              Curated Hamper Contents:
            </span>
            <div className="divide-y divide-stone-100 max-h-60 overflow-y-auto pr-1">
              {(placedOrder.hamper?.items || selectedItems).map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {item.image && (
                      <img
                        src={getOptimizedImageUrl(item.image, 80)}
                        alt={item.title}
                        className="w-10 h-10 rounded-lg object-cover border border-stone-100 shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-stone-900 truncate">{item.title}</p>
                      <p className="text-[11px] text-stone-500">
                        Qty: {item.quantity} × ₹{item.unitPrice}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-stone-900 shrink-0">
                    ₹{item.totalPrice || item.unitPrice * item.quantity}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Gift Message */}
          {(placedOrder.hamper?.giftMessage || giftMessage) && (
            <div className="p-3.5 rounded-2xl bg-cream-50/80 border border-gold-200/60 text-xs text-stone-800">
              <strong className="block text-gold-700 font-serif mb-1">Enclosed Gift Card Message:</strong>
              <p className="italic whitespace-pre-wrap">"{placedOrder.hamper?.giftMessage || giftMessage}"</p>
            </div>
          )}

          {/* Server-Calculated Final Total */}
          <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
            <span className="font-serif font-bold text-stone-900 text-sm">Server-Calculated Total:</span>
            <div className="text-right">
              <span className="font-serif text-2xl font-bold text-blush-700">
                ₹{Number(finalTotal).toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-stone-400 block">Current DB rates applied</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/orders"
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blush-500 to-rose-600 hover:from-blush-600 hover:to-rose-700 text-white font-semibold text-sm shadow-soft transition-all tap-target flex items-center justify-center gap-2"
          >
            <span>View in My Orders</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          {whatsappUrl && whatsappUrl !== '#' && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold text-sm transition-colors tap-target flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>Confirm on WhatsApp</span>
            </a>
          )}

          <button
            type="button"
            onClick={() => setPlacedOrder(null)}
            className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-sm transition-colors tap-target"
          >
            <span>Build Another Hamper</span>
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // BUILDER VIEW
  // -------------------------------------------------------------
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 pb-32">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blush-100 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold-600 uppercase tracking-widest">
            <Package className="w-3.5 h-3.5" />
            <span>Interactive Hamper Studio (F-40 to F-42)</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-4xl font-bold text-stone-900 mt-1">
            Build Your Own Hamper
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-xl">
            Choose a luxury presentation base, select your favorite gifts, add an engraved card, and watch your running total compute in real time.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleClearDraft}
            className="text-xs text-stone-500 hover:text-stone-800 px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-100 transition-colors flex items-center gap-1.5 tap-target"
            title="Reset hamper draft"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Start Fresh</span>
          </button>
        </div>
      </div>

      {/* Email Verification Required Banner (PRD F-95) */}
      {user && !user.emailVerified && (
        <div className="p-4 sm:p-5 rounded-3xl bg-amber-50/90 border border-amber-200/90 text-amber-900 shadow-2xs space-y-3">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h2 className="font-semibold text-sm text-amber-950">
                Email verification required before placing orders
              </h2>
              <p className="text-xs text-amber-800 leading-relaxed">
                Before submitting your order, please verify your email address (<strong>{user.email}</strong>). We sent a confirmation link to your inbox.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={resendingVerification}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-semibold shadow-2xs transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resendingVerification ? 'animate-spin' : ''}`} />
              <span>{resendingVerification ? 'Sending link...' : 'Resend verification email'}</span>
            </button>

            <Link
              to="/verify-email"
              className="inline-flex items-center gap-1 text-xs text-amber-800 hover:text-amber-950 font-medium underline underline-offset-2 ml-1"
            >
              <span>Have a verification token?</span>
            </Link>
          </div>

          {resendVerificationNotice && (
            <div className="text-xs font-medium text-emerald-800 bg-emerald-50/90 p-2.5 rounded-xl border border-emerald-200">
              {resendVerificationNotice}
            </div>
          )}
        </div>
      )}

      {/* Global Form Errors */}
      {formError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Notice</p>
            <p className="text-xs mt-0.5">{formError}</p>
          </div>
        </div>
      )}

      {/* Progress Navigation Pills */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-3">
        {[
          { num: 1, label: '1. Hamper Base' },
          { num: 2, label: `2. Add Items (${totalItemCount}/${MAX_ITEMS_TOTAL})` },
          { num: 3, label: '3. Message & Checkout' },
        ].map((s) => (
          <button
            key={s.num}
            type="button"
            onClick={() => setStep(s.num)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all tap-target ${
              step === s.num
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Steps */}
        <div className="lg:col-span-8 space-y-8">
          {/* STEP 1: CHOOSE HAMPER BASE */}
          {step === 1 && (
            <motion.section
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-xl font-bold text-stone-900 flex items-center gap-2">
                    <Package className="w-5 h-5 text-blush-600" />
                    <span>Step 1: Pick a Luxury Hamper Base</span>
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Select the foundational box or basket for your handcrafted presentation.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {bases.map((base) => {
                  const isSelected = selectedBaseId === base.id;
                  return (
                    <div
                      key={base.id}
                      onClick={() => setSelectedBaseId(base.id)}
                      className={`cursor-pointer p-4 rounded-3xl border-2 transition-all space-y-3 relative ${
                        isSelected
                          ? 'border-blush-500 bg-rose-50/30 shadow-soft ring-2 ring-blush-200'
                          : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gold-100 text-gold-800">
                          {base.tag || 'Handmade Base'}
                        </span>
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
                            isSelected ? 'bg-blush-600 border-blush-600 text-white' : 'border-stone-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-3" />}
                        </div>
                      </div>

                      <div>
                        <h3 className="font-serif font-bold text-stone-900 text-base leading-snug">
                          {base.name}
                        </h3>
                        <p className="text-xs text-stone-600 mt-1 line-clamp-2 leading-relaxed">
                          {base.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-stone-100 flex items-baseline justify-between">
                        <span className="text-xs text-stone-400 font-medium">Base Price</span>
                        <span className="font-serif text-lg font-bold text-blush-700">
                          ₹{Number(base.price).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blush-500 to-rose-600 hover:from-blush-600 hover:to-rose-700 text-white font-semibold text-xs sm:text-sm shadow-soft transition-all flex items-center gap-2 tap-target"
                >
                  <span>Continue to Add Items</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.section>
          )}

          {/* STEP 2: CATALOG ITEM SELECTOR */}
          {step === 2 && (
            <motion.section
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-serif text-xl font-bold text-stone-900 flex items-center gap-2">
                    <Gift className="w-5 h-5 text-blush-600" />
                    <span>Step 2: Add Items to Your Hamper</span>
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Choose from hamper-eligible creations. Max 5 per item, up to 10 total items.
                  </p>
                </div>

                {/* Capacity Counter */}
                <div className="self-start sm:self-auto px-3.5 py-1.5 rounded-2xl bg-cream-100 border border-gold-200/80 text-xs font-semibold text-stone-800 flex items-center gap-2">
                  <span>Capacity:</span>
                  <strong className={totalItemCount >= MAX_ITEMS_TOTAL ? 'text-rose-600' : 'text-stone-900'}>
                    {totalItemCount} / {MAX_ITEMS_TOTAL} items
                  </strong>
                </div>
              </div>

              {/* Search & Category Filter Bar */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search chocolates, frames, bouquets, plaques..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-stone-200 bg-white text-xs sm:text-sm text-stone-900 focus:border-blush-500 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {['All', 'Frame', 'Bouquet', 'Engraved', 'Hamper', 'Other'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition-colors ${
                        categoryFilter === cat
                          ? 'bg-blush-600 text-white'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Items Grid */}
              {catalogLoading ? (
                <div className="py-12 text-center text-xs text-stone-400">Loading hamper-eligible catalogue...</div>
              ) : filteredCatalogItems.length === 0 ? (
                <div className="p-8 text-center rounded-3xl bg-cream-50 border border-stone-200 text-xs text-stone-500">
                  No items matched your search. Try adjusting keywords or category filters.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredCatalogItems.map((item) => {
                    const itemId = item._id || item.id;
                    const existingInHamper = selectedItems.find((i) => i.item === itemId);
                    const qty = existingInHamper ? existingInHamper.quantity : 0;
                    const unitPrice = item.startingPrice || item.price || 0;
                    const isFull = totalItemCount >= MAX_ITEMS_TOTAL;
                    const isMaxThis = qty >= MAX_PER_ITEM;

                    return (
                      <div
                        key={itemId}
                        className="p-3.5 rounded-3xl border border-stone-200/90 bg-white shadow-2xs hover:shadow-soft transition-shadow flex items-start gap-3.5"
                      >
                        {item.images?.[0]?.url && (
                          <img
                            src={getOptimizedImageUrl(item.images[0].url, 120)}
                            alt={item.title}
                            className="w-18 h-18 rounded-2xl object-cover border border-stone-100 shrink-0"
                          />
                        )}

                        <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-blush-700 tracking-wider block">
                              {item.category}
                            </span>
                            <h4 className="font-serif font-bold text-stone-900 text-xs sm:text-sm truncate">
                              {item.title}
                            </h4>
                            <span className="font-serif font-bold text-stone-800 text-xs mt-0.5 block">
                              ₹{Number(unitPrice).toLocaleString('en-IN')}
                            </span>
                          </div>

                          <div className="pt-2 flex items-center justify-between">
                            {qty === 0 ? (
                              <button
                                type="button"
                                onClick={() => handleAddItem(item)}
                                disabled={isFull}
                                className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-40 disabled:hover:bg-stone-900 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors tap-target"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add to Hamper</span>
                              </button>
                            ) : (
                              <div className="inline-flex items-center gap-2 bg-stone-100 px-2 py-1 rounded-xl border border-stone-200">
                                <button
                                  type="button"
                                  onClick={() => handleDecrementItem(itemId)}
                                  className="w-6 h-6 rounded-lg bg-white text-stone-700 hover:bg-stone-200 flex items-center justify-center tap-target"
                                  title="Decrease quantity"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="font-mono text-xs font-bold text-stone-900 px-1">
                                  {qty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleAddItem(item)}
                                  disabled={isFull || isMaxThis}
                                  className="w-6 h-6 rounded-lg bg-white text-stone-700 hover:bg-stone-200 disabled:opacity-40 flex items-center justify-center tap-target"
                                  title={isMaxThis ? 'Maximum 5 of this item' : 'Increase quantity'}
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(itemId)}
                                  className="ml-1 text-stone-400 hover:text-rose-600 tap-target"
                                  title="Remove item"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Navigation buttons */}
              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-2xl border border-stone-200 hover:bg-stone-100 text-stone-700 font-semibold text-xs transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Change Base</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (selectedItems.length === 0) {
                      setFormError('Please add at least 1 item to your hamper before continuing.');
                      return;
                    }
                    setStep(3);
                  }}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blush-500 to-rose-600 hover:from-blush-600 hover:to-rose-700 text-white font-semibold text-xs sm:text-sm shadow-soft transition-all flex items-center gap-2 tap-target"
                >
                  <span>Proceed to Gift Message & Delivery</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.section>
          )}

          {/* STEP 3: MESSAGE, DELIVERY & SUBMIT */}
          {step === 3 && (
            <motion.form
              onSubmit={handleSubmitOrder}
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="font-serif text-xl font-bold text-stone-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-gold-500" />
                  <span>Step 3: Gift Message & Order Details</span>
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Complete your presentation with a personalized keepsake card and shipping instructions.
                </p>
              </div>

              {/* Optional Gift Message Card */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-blush-100 shadow-soft space-y-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="gift-message" className="text-xs font-bold uppercase tracking-wider text-stone-700">
                    Handwritten Gift Card Message (Optional)
                  </label>
                  <span className="text-[11px] font-mono text-stone-400">
                    {giftMessage.length} / 500
                  </span>
                </div>
                <textarea
                  id="gift-message"
                  value={giftMessage}
                  maxLength={500}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  rows={3}
                  placeholder="e.g. Wishing you a lifetime of happiness together! With all our love, Aisha & Rohan."
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 bg-cream-50/50 text-stone-900 text-xs sm:text-sm focus:bg-white focus:border-blush-500 transition-colors resize-none"
                />
                <p className="text-[11px] text-stone-500">
                  Our artisans transcribe your message onto our wax-sealed textured parchment card.
                </p>
                {fieldErrors.giftMessage && (
                  <p className="text-xs text-rose-600">{fieldErrors.giftMessage}</p>
                )}
              </div>

              {/* Delivery Details */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-blush-100 shadow-soft space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  Delivery & Contact Information
                </h3>

                {/* Delivery Type Radios */}
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer flex items-center gap-2.5 transition-all ${
                      deliveryType === 'delivery'
                        ? 'border-blush-500 bg-rose-50/30 text-stone-900 font-semibold'
                        : 'border-stone-200 text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="deliveryType"
                      value="delivery"
                      checked={deliveryType === 'delivery'}
                      onChange={() => setDeliveryType('delivery')}
                      className="sr-only"
                    />
                    <MapPin className="w-4 h-4 text-blush-600" />
                    <span className="text-xs">Home Delivery</span>
                  </label>

                  <label
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer flex items-center gap-2.5 transition-all ${
                      deliveryType === 'pickup'
                        ? 'border-blush-500 bg-rose-50/30 text-stone-900 font-semibold'
                        : 'border-stone-200 text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="deliveryType"
                      value="pickup"
                      checked={deliveryType === 'pickup'}
                      onChange={() => setDeliveryType('pickup')}
                      className="sr-only"
                    />
                    <Store className="w-4 h-4 text-blush-600" />
                    <span className="text-xs">Store Pickup</span>
                  </label>
                </div>

                {/* Address Input */}
                {deliveryType === 'delivery' && (
                  <div>
                    <label htmlFor="delivery-address" className="block text-xs font-medium text-stone-700 mb-1">
                      Complete Shipping Address & Pincode *
                    </label>
                    <textarea
                      id="delivery-address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      rows={2}
                      placeholder="Flat/House No., Street, Landmark, City, State, Pincode"
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 bg-cream-50/50 text-stone-900 text-xs sm:text-sm focus:bg-white focus:border-blush-500 transition-colors resize-none"
                    />
                    {fieldErrors.address && (
                      <p className="text-xs text-rose-600 mt-1">{fieldErrors.address}</p>
                    )}
                  </div>
                )}

                {/* Contact Phone & Needed-By Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="customer-phone" className="block text-xs font-medium text-stone-700 mb-1">
                      WhatsApp Contact Number *
                    </label>
                    <input
                      id="customer-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 bg-cream-50/50 text-stone-900 text-xs sm:text-sm focus:bg-white focus:border-blush-500 transition-colors"
                    />
                    {fieldErrors.phone && (
                      <p className="text-xs text-rose-600 mt-1">{fieldErrors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="needed-by" className="block text-xs font-medium text-stone-700 mb-1">
                      Needed-By Date (Optional)
                    </label>
                    <input
                      id="needed-by"
                      type="date"
                      min={minDateString}
                      value={neededByDate}
                      onChange={(e) => setNeededByDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 bg-cream-50/50 text-stone-900 text-xs sm:text-sm focus:bg-white focus:border-blush-500 transition-colors"
                    />
                    {fieldErrors.neededByDate && (
                      <p className="text-xs text-rose-600 mt-1">{fieldErrors.neededByDate}</p>
                    )}
                  </div>
                </div>

                {/* Special Instructions */}
                <div>
                  <label htmlFor="special-notes" className="block text-xs font-medium text-stone-700 mb-1">
                    Special Packaging Requests or Ribbon Color Preferences
                  </label>
                  <input
                    id="special-notes"
                    type="text"
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                    placeholder="e.g. Gold satin ribbon, include fresh dried lavender sprigs..."
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 bg-cream-50/50 text-stone-900 text-xs sm:text-sm focus:bg-white focus:border-blush-500 transition-colors"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2.5 rounded-2xl border border-stone-200 hover:bg-stone-100 text-stone-700 font-semibold text-xs transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Item Picker</span>
                </button>

                <button
                  type="submit"
                  disabled={submitting || (user && !user.emailVerified)}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blush-500 via-rose-600 to-blush-600 hover:from-blush-600 hover:to-rose-700 disabled:opacity-50 text-white font-bold text-sm shadow-soft transition-all flex items-center gap-2 tap-target"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Verifying & Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span>Place Hamper Order (₹{Number(runningTotal).toLocaleString('en-IN')})</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.form>
          )}
        </div>

        {/* Right Column (Desktop Sticky Summary) */}
        <aside className="lg:col-span-4 sticky top-28 hidden lg:block space-y-4">
          <div className="bg-white rounded-3xl border border-blush-100 p-5 shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif font-bold text-stone-900 text-base">Hamper Summary</h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cream-100 text-stone-700">
                {totalItemCount} / {MAX_ITEMS_TOTAL} items
              </span>
            </div>

            {/* Selected Base */}
            <div className="p-3 rounded-2xl bg-cream-50 border border-gold-200/50 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-blush-700 tracking-wider block">
                  Chosen Base
                </span>
                <span className="font-semibold text-stone-900 text-xs block">{selectedBase.name}</span>
              </div>
              <span className="font-serif font-bold text-stone-900 text-xs">
                ₹{Number(selectedBase.price).toLocaleString('en-IN')}
              </span>
            </div>

            {/* Selected Items List */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
                Selected Items ({selectedItems.length}):
              </span>
              {selectedItems.length === 0 ? (
                <p className="text-xs text-stone-400 italic py-2">No gifts added to your hamper yet.</p>
              ) : (
                <div className="divide-y divide-stone-100 max-h-56 overflow-y-auto pr-1">
                  {selectedItems.map((item) => (
                    <div key={item.item} className="py-2 flex items-center justify-between gap-2 text-xs">
                      <div className="min-w-0">
                        <p className="font-medium text-stone-900 truncate text-xs">{item.title}</p>
                        <p className="text-[11px] text-stone-500">
                          {item.quantity} × ₹{item.unitPrice}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-bold text-stone-900 text-xs">
                          ₹{item.unitPrice * item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.item)}
                          className="text-stone-300 hover:text-rose-600 p-0.5"
                          title="Remove item"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Price Calculations */}
            <div className="pt-3 border-t border-stone-100 space-y-1.5 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>Base Hamper:</span>
                <span>₹{Number(selectedBase.price).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Items Subtotal:</span>
                <span>₹{Number(itemsSubtotal).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-stone-200 text-sm font-bold text-stone-900 font-serif">
                <span>Live Running Total:</span>
                <span className="text-blush-700 text-lg">
                  ₹{Number(runningTotal).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {step < 3 && selectedItems.length > 0 && (
              <button
                type="button"
                onClick={() => setStep(3)}
                className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Review & Checkout</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </aside>
      </div>

      {/* Mobile Sticky Running Total Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-white/95 backdrop-blur-md border-t border-stone-200 p-3.5 shadow-2xl">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-stone-400">Total</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-cream-100 text-stone-700">
                {totalItemCount} items
              </span>
            </div>
            <span className="font-serif text-lg font-bold text-blush-700 leading-tight block">
              ₹{Number(runningTotal).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {step < 3 ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 1) setStep(2);
                  else if (selectedItems.length > 0) setStep(3);
                  else setFormError('Please add at least 1 item to your hamper first.');
                }}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blush-500 to-rose-600 text-white font-semibold text-xs shadow-soft flex items-center gap-1 tap-target"
              >
                <span>{step === 1 ? 'Pick Items' : 'Checkout'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitOrder}
                disabled={submitting || (user && !user.emailVerified)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blush-500 to-rose-600 text-white font-semibold text-xs shadow-soft flex items-center gap-1 tap-target disabled:opacity-50"
              >
                <span>{submitting ? 'Placing...' : 'Submit Order'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
