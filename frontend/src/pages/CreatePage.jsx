import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Sparkles,
  Gift,
  Upload,
  X,
  Calendar,
  Phone,
  MapPin,
  Store,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  Clock,
  Copy,
  MessageCircle,
  Image as ImageIcon,
  Check,
} from 'lucide-react';
import { useDraft } from '../hooks/useDraft';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../lib/api';
import { getTodayKolkataDateString } from '../lib/date';
import { cleanWhatsAppNumber, getShopWhatsAppUrl } from '../lib/whatsapp';

export function CreatePage() {
  const shouldReduceMotion = useReducedMotion();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { draft, updateDraft, clearDraft } = useDraft();

  // Catalogue items for selector
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(true);

  // Form states initialized from draft or searchParams
  const [selectedItemId, setSelectedItemId] = useState(draft.selectedItemId || '');
  const [customizationAnswers, setCustomizationAnswers] = useState(draft.customizationAnswers || {});
  const [requirements, setRequirements] = useState(draft.requirements || '');
  const [referenceImages, setReferenceImages] = useState(draft.referenceImages || []);
  const [neededByDate, setNeededByDate] = useState(draft.neededByDate || '');
  const [phone, setPhone] = useState(draft.phone || user?.phone || '');
  const [deliveryType, setDeliveryType] = useState(draft.deliveryType || 'delivery');
  const [address, setAddress] = useState(draft.address || '');

  // Upload & submission states
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [savedNotice, setSavedNotice] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [copiedOrder, setCopiedOrder] = useState(false);

  const fileInputRef = useRef(null);
  const minDateString = getTodayKolkataDateString();

  // Load catalog items for item selector
  useEffect(() => {
    let isMounted = true;
    async function loadItems() {
      try {
        const res = await api.get('/api/items?limit=100');
        if (isMounted) {
          setItems(res.items || []);
        }
      } catch {
        // Fallback gracefully
      } finally {
        if (isMounted) setItemsLoading(false);
      }
    }
    loadItems();
    return () => {
      isMounted = false;
    };
  }, []);

  // Update phone if user logs in and phone is not yet set
  useEffect(() => {
    if (user?.phone && !phone) {
      setPhone(user.phone);
      updateDraft({ phone: user.phone });
    }
  }, [user, phone, updateDraft]);

  // Handle URL prefilling: ?item=<id>
  useEffect(() => {
    const paramItem = searchParams.get('item');
    if (paramItem && paramItem !== selectedItemId) {
      setSelectedItemId(paramItem);
      updateDraft({ selectedItemId: paramItem });
    }
  }, [searchParams, selectedItemId, updateDraft]);

  // Helper for field change with draft persistence
  const handleFieldChange = (setter, field, value) => {
    setter(value);
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: null }));
    }
    updateDraft({ [field]: value });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const handleCustomizationChange = (label, value) => {
    const updated = { ...customizationAnswers, [label]: value };
    setCustomizationAnswers(updated);
    updateDraft({ customizationAnswers: updated });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  // Currently selected item object
  const currentItem = items.find((i) => i._id === selectedItemId);

  // Upload reference image (max 3)
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (referenceImages.length >= 3) {
      setUploadError('Maximum of 3 reference photos allowed per order.');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setUploadError('Only JPG, PNG, and WebP images are allowed.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size must be less than 5 MB.');
      return;
    }

    // Must be logged in to upload images
    if (!user) {
      navigate('/signin?next=/create');
      return;
    }

    setUploadingImage(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const result = await api.post('/api/orders/upload', formData);
      const updated = [...referenceImages, { url: result.url, publicId: result.publicId }];
      setReferenceImages(updated);
      updateDraft({ referenceImages: updated });
    } catch (err) {
      setUploadError(err.message || 'Failed to upload photo. Please try again.');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Remove uploaded reference photo (calls cleanup endpoint)
  const handleRemoveImage = async (indexToRemove) => {
    const toRemove = referenceImages[indexToRemove];
    const updated = referenceImages.filter((_, idx) => idx !== indexToRemove);
    setReferenceImages(updated);
    updateDraft({ referenceImages: updated });

    if (toRemove?.publicId) {
      try {
        await api.delete('/api/orders/upload', {
          body: { publicId: toRemove.publicId },
        });
      } catch {
        // Continue silently on image cleanup failure
      }
    }
  };

  // Reset form & draft
  const handleResetDraft = () => {
    clearDraft();
    setSelectedItemId('');
    setCustomizationAnswers({});
    setRequirements('');
    setReferenceImages([]);
    setNeededByDate('');
    setPhone(user?.phone || '');
    setDeliveryType('delivery');
    setAddress('');
    setFieldErrors({});
    setFormError(null);
  };

  // Validate form before submission
  const validateForm = () => {
    const errors = {};

    const cleanPhone = cleanWhatsAppNumber(phone);
    if (!cleanPhone || cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      errors.phone = 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210)';
    }

    if (neededByDate) {
      const d = new Date(neededByDate);
      if (isNaN(d.getTime())) {
        errors.neededByDate = 'Needed-by date must be a valid date';
      } else if (neededByDate < minDateString) {
        errors.neededByDate = 'Needed-by date cannot be in the past';
      }
    }

    if (deliveryType === 'delivery') {
      if (!address || address.trim().length < 5) {
        errors.address = 'Please provide a complete delivery address with pincode.';
      }
    }

    if (!selectedItemId && (!requirements || requirements.trim().length < 5)) {
      errors.requirements =
        'For fully custom creations, please describe what you want made (at least 5 characters).';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit order
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (authLoading || submitting || uploadingImage) return;

    setFormError(null);
    setFieldErrors({});

    // Require authentication
    if (!user) {
      navigate('/signin?next=/create');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const cleanPhone = cleanWhatsAppNumber(phone);
      const deliveryAddress = deliveryType === 'pickup' ? 'pickup' : address.trim();

      const answersArray = Object.entries(customizationAnswers)
        .filter(([_, val]) => Boolean(val && String(val).trim()))
        .map(([label, value]) => ({ label, value: String(value).trim() }));

      const payload = {
        item: selectedItemId || null,
        customizationAnswers: answersArray,
        requirements: requirements.trim(),
        referenceImages,
        neededByDate: neededByDate ? new Date(neededByDate).toISOString() : null,
        phone: cleanPhone,
        deliveryType,
        address: deliveryAddress,
        customer: {
          name: user.name,
          phone: cleanPhone,
          address: deliveryAddress,
        },
      };

      const result = await api.post('/api/orders', payload);
      setPlacedOrder(result.order);
      clearDraft();
    } catch (err) {
      if (err instanceof ApiError) {
        if (Array.isArray(err.details) && err.details.length > 0) {
          const map = {};
          err.details.forEach((d) => {
            map[d.field] = d.message;
          });
          setFieldErrors(map);
        } else {
          setFormError(err.message);
        }
      } else {
        setFormError('Failed to place order. Please try again.');
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
    const successMsg = `Hello Fouzas Creation! I just placed order #${placedOrder.orderNumber} for "${
      placedOrder.itemSnapshot?.title || 'Bespoke Custom Creation'
    }". Could you please confirm details?`;
    const whatsappUrl = getShopWhatsAppUrl(successMsg);

    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center space-y-6">
        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-soft"
        >
          <CheckCircle2 className="w-10 h-10" />
        </motion.div>

        <div className="space-y-2">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
            Order Placed Successfully!
          </h1>
          <p className="text-sm text-stone-600 max-w-md mx-auto">
            Thank you, <strong className="text-stone-900">{user?.name}</strong>. Your custom gift request has been assigned reference:
          </p>
        </div>

        {/* Order Number Box */}
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

        {/* What Happens Next Card */}
        <div className="bg-white rounded-3xl border border-blush-100 p-6 text-left shadow-soft space-y-3">
          <h3 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-gold-500" />
            <span>What happens next?</span>
          </h3>
          <ul className="text-xs text-stone-600 space-y-2.5">
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-blush-50 text-blush-700 font-bold flex items-center justify-center shrink-0 mt-0.5">
                1
              </span>
              <span>
                Our artisans will carefully review your requirements, design choices, and requested needed-by schedule.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-blush-50 text-blush-700 font-bold flex items-center justify-center shrink-0 mt-0.5">
                2
              </span>
              <span>
                We will confirm availability and update your customized <strong>quoted price</strong> and <strong>ready-by date</strong> in your dashboard.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-blush-50 text-blush-700 font-bold flex items-center justify-center shrink-0 mt-0.5">
                3
              </span>
              <span>
                You can track milestones in real time or message us directly on WhatsApp with any special adjustments!
              </span>
            </li>
          </ul>
        </div>

        {/* Action Links */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/orders"
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blush-500 to-rose-600 hover:from-blush-600 hover:to-rose-700 text-white font-semibold text-sm shadow-soft transition-all tap-target flex items-center justify-center gap-2"
          >
            <span>View in My Orders</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to={`/track?orderNumber=${placedOrder.orderNumber}&phone=${phone}`}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 font-semibold text-sm transition-all tap-target flex items-center justify-center gap-2"
          >
            <span>Public Track Link</span>
          </Link>

          {whatsappUrl && whatsappUrl !== '#' && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold text-sm transition-colors tap-target flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>Chat on WhatsApp</span>
            </a>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // ORDER FORM VIEW
  // -------------------------------------------------------------
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blush-100 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold-600 uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Custom Gift Request</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-4xl font-bold text-stone-900 mt-1">
            Design Your Creation
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Choose a catalog base or create a fully custom piece from scratch. Your draft is auto-saved.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {savedNotice && (
            <span className="text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Draft saved
            </span>
          )}
          <button
            type="button"
            onClick={handleResetDraft}
            className="text-xs text-stone-500 hover:text-stone-800 px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-100 transition-colors flex items-center gap-1.5 tap-target"
            title="Clear all fields"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {formError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Unable to submit order</p>
            <p className="text-xs mt-0.5">{formError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: Item Selection */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-blush-100 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
              <Gift className="w-5 h-5 text-blush-600" />
              <span>1. Choose Gift Base</span>
            </h2>
            <span className="text-xs text-stone-400">Optional</span>
          </div>

          <div>
            <label
              htmlFor="item-selector"
              className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5"
            >
              Catalog Base or Custom
            </label>
            <select
              id="item-selector"
              value={selectedItemId}
              onChange={(e) => handleFieldChange(setSelectedItemId, 'selectedItemId', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-cream-50/50 text-stone-900 text-sm focus:bg-white focus:border-blush-500 transition-colors"
            >
              <option value="">✨ Fully Custom Creation (Bespoke request)</option>
              {items.map((it) => (
                <option key={it._id} value={it._id}>
                  {it.title} ({it.category}) — {it.startingPrice ? `Starts ₹${it.startingPrice}` : 'Price on request'}
                </option>
              ))}
            </select>
          </div>

          {/* Selected Item Preview Card */}
          {currentItem && (
            <div className="p-3.5 rounded-2xl bg-cream-50 border border-gold-200/60 flex items-center gap-3">
              {currentItem.images?.[0]?.url && (
                <img
                  src={currentItem.images[0].url}
                  alt={currentItem.title}
                  className="w-14 h-14 rounded-xl object-cover border border-stone-200 shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <span className="text-[10px] uppercase font-bold text-blush-700 tracking-wider block">
                  {currentItem.category}
                </span>
                <h4 className="font-serif font-bold text-stone-900 text-sm truncate">
                  {currentItem.title}
                </h4>
                <span className="text-xs text-stone-500">
                  {currentItem.startingPrice
                    ? `Starts at ₹${Number(currentItem.startingPrice).toLocaleString('en-IN')}`
                    : 'Bespoke pricing'}
                </span>
              </div>
            </div>
          )}

          {/* Dynamic Customization Options from Item */}
          {currentItem && Array.isArray(currentItem.customizationOptions) && currentItem.customizationOptions.length > 0 && (
            <div className="pt-3 border-t border-stone-100 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Item Customization Options
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentItem.customizationOptions.map((opt, idx) => {
                  const label = typeof opt === 'string' ? opt : opt.label;
                  return (
                    <div key={idx}>
                      <label className="block text-xs font-medium text-stone-700 mb-1">
                        {label}
                      </label>
                      <input
                        type="text"
                        value={customizationAnswers[label] || ''}
                        onChange={(e) => handleCustomizationChange(label, e.target.value)}
                        placeholder={`Specify ${label.toLowerCase()}...`}
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-cream-50/50 text-stone-800 text-xs focus:bg-white focus:border-blush-500 transition-colors"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* SECTION 2: Custom Requirements & Notes */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-blush-100 shadow-soft space-y-4">
          <h2 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gold-500" />
            <span>2. Requirements & Personalization</span>
          </h2>

          <div>
            <label
              htmlFor="requirements"
              className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5"
            >
              Description, Inscription & Special Requests
            </label>
            <textarea
              id="requirements"
              rows={4}
              maxLength={2000}
              value={requirements}
              onChange={(e) => handleFieldChange(setRequirements, 'requirements', e.target.value)}
              placeholder="Tell us what you envision: recipient name, custom message/quotes, colour palette, occasion, preferred theme (e.g., anniversary hamper with fairy lights and custom frame)..."
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-cream-50/50 text-stone-800 focus:bg-white transition-colors ${
                fieldErrors.requirements
                  ? 'border-rose-400 focus:border-rose-500 ring-1 ring-rose-200'
                  : 'border-stone-200 focus:border-blush-500'
              }`}
            />
            <div className="flex justify-between items-center text-[10px] text-stone-400 mt-1">
              <span>{fieldErrors.requirements ? <span className="text-rose-600">{fieldErrors.requirements}</span> : 'Describe clearly for accurate quotation'}</span>
              <span>{requirements.length} / 2000</span>
            </div>
          </div>

          {/* Reference Photos Upload (Max 3) */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                Reference Photos (Max 3)
              </label>
              <span className="text-xs text-stone-400">{referenceImages.length} of 3 added</span>
            </div>

            {/* Uploaded Thumbnails Grid */}
            <div className="flex flex-wrap gap-3 mb-3">
              {referenceImages.map((img, idx) => (
                <div
                  key={idx}
                  className="relative w-20 h-20 rounded-2xl overflow-hidden border border-stone-200 group shadow-xs"
                >
                  <img
                    src={img.url}
                    alt={`Reference ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-rose-600 transition-colors tap-target"
                    title="Remove photo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {referenceImages.length < 3 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="w-20 h-20 rounded-2xl border-2 border-dashed border-stone-300 hover:border-blush-500 bg-stone-50/60 hover:bg-blush-50/40 text-stone-500 hover:text-blush-600 flex flex-col items-center justify-center gap-1 transition-colors tap-target"
                >
                  {uploadingImage ? (
                    <span className="w-5 h-5 border-2 border-blush-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      <span className="text-[10px] font-medium">Add Photo</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageUpload}
              className="hidden"
            />

            {uploadError && (
              <p className="text-xs text-rose-600 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{uploadError}</span>
              </p>
            )}
            <p className="text-[11px] text-stone-400">
              Accepted: JPG, PNG, WebP up to 5MB each. Upload design references, sketches or recipient photos.
            </p>
          </div>
        </div>

        {/* SECTION 3: Schedule & Delivery */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-blush-100 shadow-soft space-y-5">
          <h2 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blush-600" />
            <span>3. Schedule & Contact Details</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="neededByDate"
                className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5"
              >
                Needed-By Date (Optional)
              </label>
              <input
                id="neededByDate"
                type="date"
                min={minDateString}
                value={neededByDate}
                onChange={(e) => handleFieldChange(setNeededByDate, 'neededByDate', e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-cream-50/50 text-stone-800 focus:bg-white transition-colors ${
                  fieldErrors.neededByDate
                    ? 'border-rose-400 focus:border-rose-500 ring-1 ring-rose-200'
                    : 'border-stone-200 focus:border-blush-500'
                }`}
              />
              {fieldErrors.neededByDate ? (
                <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.neededByDate}</p>
              ) : (
                <span className="text-[10px] text-stone-400 mt-1 block">
                  Must be today or a future date.
                </span>
              )}
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5"
              >
                Contact Mobile Number
              </label>
              <div className="relative">
                <input
                  id="phone"
                  type="tel"
                  maxLength={13}
                  required
                  value={phone}
                  onChange={(e) => handleFieldChange(setPhone, 'phone', e.target.value)}
                  placeholder="e.g. 9876543210"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-cream-50/50 text-stone-800 focus:bg-white transition-colors ${
                    fieldErrors.phone
                      ? 'border-rose-400 focus:border-rose-500 ring-1 ring-rose-200'
                      : 'border-stone-200 focus:border-blush-500'
                  }`}
                />
              </div>
              {fieldErrors.phone ? (
                <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.phone}</p>
              ) : (
                <span className="text-[10px] text-stone-400 mt-1 block">
                  Used for order tracking and WhatsApp updates.
                </span>
              )}
            </div>
          </div>

          {/* Delivery or Pickup Toggle */}
          <div className="pt-2 border-t border-stone-100">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2.5">
              Fulfilment Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleFieldChange(setDeliveryType, 'deliveryType', 'delivery')}
                className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all tap-target ${
                  deliveryType === 'delivery'
                    ? 'border-blush-500 bg-blush-50/60 ring-2 ring-blush-200'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <MapPin className={`w-4 h-4 mt-0.5 ${deliveryType === 'delivery' ? 'text-blush-600' : 'text-stone-400'}`} />
                <div>
                  <span className="text-xs font-bold text-stone-900 block">Home Delivery</span>
                  <span className="text-[11px] text-stone-500">Shipped to your doorstep</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleFieldChange(setDeliveryType, 'deliveryType', 'pickup')}
                className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all tap-target ${
                  deliveryType === 'pickup'
                    ? 'border-blush-500 bg-blush-50/60 ring-2 ring-blush-200'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <Store className={`w-4 h-4 mt-0.5 ${deliveryType === 'pickup' ? 'text-blush-600' : 'text-stone-400'}`} />
                <div>
                  <span className="text-xs font-bold text-stone-900 block">Studio Pickup</span>
                  <span className="text-[11px] text-stone-500">Collect from Bengaluru Studio</span>
                </div>
              </button>
            </div>

            {/* Address Field if delivery selected */}
            {deliveryType === 'delivery' ? (
              <div className="mt-3.5">
                <label
                  htmlFor="address"
                  className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1"
                >
                  Delivery Address & Pincode
                </label>
                <textarea
                  id="address"
                  rows={2}
                  maxLength={500}
                  value={address}
                  onChange={(e) => handleFieldChange(setAddress, 'address', e.target.value)}
                  placeholder="Apartment / House number, Street name, Area, City, Pincode"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-cream-50/50 text-stone-800 focus:bg-white transition-colors ${
                    fieldErrors.address
                      ? 'border-rose-400 focus:border-rose-500 ring-1 ring-rose-200'
                      : 'border-stone-200 focus:border-blush-500'
                  }`}
                />
                {fieldErrors.address && (
                  <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.address}</p>
                )}
              </div>
            ) : (
              <div className="mt-3 p-3.5 rounded-2xl bg-cream-100/70 border border-gold-200/60 text-xs text-stone-700 space-y-1">
                <span className="font-bold text-stone-900 block flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-gold-600" />
                  <span>Pickup Location: Fouzas Creation Studio, Bengaluru</span>
                </span>
                <p className="text-[11px] text-stone-600">
                  We will notify you on WhatsApp as soon as your creation is ready with your collection timing slot.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={submitting || uploadingImage}
          whileHover={shouldReduceMotion ? {} : { scale: 1.01 }}
          whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-blush-500 via-blush-600 to-rose-600 hover:from-blush-600 hover:to-rose-700 disabled:opacity-70 text-white font-semibold text-base shadow-elevated transition-all flex items-center justify-center gap-2 tap-target"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Placing your order...</span>
            </span>
          ) : !user ? (
            <>
              <Gift className="w-5 h-5 text-gold-200" />
              <span>Sign In to Place Order</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </>
          ) : (
            <>
              <Gift className="w-5 h-5 text-gold-200" />
              <span>Submit Custom Gift Request</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </>
          )}
        </motion.button>
      </form>
    </div>
  );
}
