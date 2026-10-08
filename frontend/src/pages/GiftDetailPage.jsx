import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Package,
  Sliders,
  Calendar,
  Truck,
  Gift,
  ArrowRight,
  AlertCircle,
  Clock,
  MessageCircle,
} from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { Skeleton } from '../components/Skeleton';
import { getShopWhatsAppUrl } from '../lib/whatsapp';

export function GiftDetailPage() {
  const shouldReduceMotion = useReducedMotion();
  const { slug } = useParams();
  const navigate = useNavigate();
  const [gift, setGift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setNotFound(false);
    setError(null);
    setActiveImageIndex(0);

    async function fetchGift() {
      try {
        const data = await api.get(`/api/items/${slug}`);
        if (isMounted) {
          const item = data?.item || data?.gift;
          if (item) {
            setGift(item);
          } else {
            setNotFound(true);
          }
        }
      } catch (err) {
        if (isMounted) {
          if (err instanceof ApiError && err.status === 404) {
            setNotFound(true);
          } else {
            setError(err.message || 'Failed to load gift details.');
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (slug) {
      fetchGift();
    }

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
        <Skeleton className="h-6 w-32 rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="space-y-4">
            <Skeleton className="aspect-square w-full rounded-3xl" />
            <div className="flex gap-3">
              <Skeleton className="w-20 h-20 rounded-2xl" />
              <Skeleton className="w-20 h-20 rounded-2xl" />
              <Skeleton className="w-20 h-20 rounded-2xl" />
            </div>
          </div>
          <div className="space-y-6">
            <Skeleton className="h-4 w-24 rounded-full" />
            <Skeleton className="h-10 w-3/4 rounded-xl" />
            <Skeleton className="h-8 w-36 rounded-xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-14 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 mx-auto flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-stone-900">
          Gift Not Found
        </h1>
        <p className="text-stone-500 text-sm max-w-sm mx-auto leading-relaxed">
          The requested gift creation could not be found or may have been unlisted. Explore our full catalog to discover more bespoke handcrafted treasures.
        </p>
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/explore"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blush-600 text-white font-semibold text-sm shadow-soft hover:bg-blush-700 transition-colors"
          >
            Explore Catalog
          </Link>
          <Link
            to="/"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white border border-stone-200 text-stone-700 font-semibold text-sm hover:bg-stone-50 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (error || !gift) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-stone-900">Something went wrong</h2>
        <p className="text-sm text-stone-500">{error || 'Unable to display this gift at the moment.'}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 rounded-xl bg-blush-600 text-white text-sm font-semibold hover:bg-blush-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const images = gift.images && gift.images.length > 0
    ? gift.images
    : [{ url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80', publicId: '' }];

  const activeImage = images[activeImageIndex] || images[0];

  const primaryOccasion = gift.occasions?.[0] || 'Birthday';
  const customizeUrl = `/create?item=${gift._id || ''}`;
  const whatsappMessage = `Hello Fouzas Creation! I'd love to enquire about customizing "${gift.title}".`;
  const whatsappUrl = getShopWhatsAppUrl(whatsappMessage);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 pb-32 md:pb-10">
      {/* Breadcrumb / Back button */}
      <div className="flex items-center gap-2 text-xs font-medium text-stone-500">
        <Link
          to="/explore"
          className="inline-flex items-center gap-1 hover:text-blush-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Catalog</span>
        </Link>
        <span>/</span>
        <span className="text-stone-400">{gift.category}</span>
        <span>/</span>
        <span className="text-stone-700 font-semibold truncate max-w-[200px]">{gift.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
        {/* Gallery Section */}
        <div className="space-y-4">
          <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-stone-100 border border-stone-200/80 shadow-soft">
            <AnimatePresence mode="wait">
              <motion.img
                key={activeImage.url}
                src={activeImage.url}
                alt={gift.title}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="w-full h-full object-cover object-center"
              />
            </AnimatePresence>

            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full bg-white/95 backdrop-blur-xs text-xs font-bold text-blush-700 shadow-xs border border-blush-100">
                {gift.category}
              </span>
              {gift.isFeatured && (
                <span className="px-2.5 py-1 rounded-full bg-gold-400 text-stone-900 text-xs font-bold shadow-xs flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-stone-900" />
                  Featured
                </span>
              )}
            </div>
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
              {images.map((img, idx) => (
                <motion.button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
                  className={`relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 border-2 transition-all tap-target ${
                    activeImageIndex === idx
                      ? 'border-blush-500 ring-2 ring-blush-200 scale-102'
                      : 'border-transparent opacity-75 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img.url}
                    alt={`${gift.title} thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover object-center"
                  />
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details Section */}
        <div className="space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blush-600 block mb-1">
              Fouzas Creation Bespoke
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 leading-tight">
              {gift.title}
            </h1>
            {gift.shortDescription && (
              <p className="mt-2 text-sm sm:text-base text-stone-600 leading-relaxed font-sans">
                {gift.shortDescription}
              </p>
            )}
          </div>

          {/* Price Box */}
          <div className="p-4 rounded-2xl bg-cream-100/70 border border-gold-200/60 flex items-baseline justify-between">
            <div>
              {gift.startingPrice !== null && gift.startingPrice !== undefined && Number(gift.startingPrice) > 0 ? (
                <>
                  <span className="text-xs font-medium uppercase tracking-wider text-stone-500 block">
                    {gift.priceNote || 'Starting Price'}
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="font-serif text-3xl font-bold text-stone-900">
                      ₹{Number(gift.startingPrice).toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-stone-400">INR</span>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-xs font-medium uppercase tracking-wider text-stone-500 block">
                    Bespoke Pricing
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="font-serif text-2xl font-bold text-stone-900">
                      Price on request
                    </span>
                  </div>
                </>
              )}
            </div>
            <span className="text-xs text-stone-500 bg-white px-2.5 py-1 rounded-lg border border-stone-200/80 shadow-xs">
              Handcrafted on Order
            </span>
          </div>

          {/* Primary Action Button */}
          <div className="space-y-3">
            <Link
              to={customizeUrl}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-blush-500 via-blush-600 to-rose-600 hover:from-blush-600 hover:to-rose-700 text-white font-semibold text-base shadow-elevated transition-all flex items-center justify-center gap-2 tap-target transform active:scale-98"
            >
              <Gift className="w-5 h-5 text-gold-300" />
              <span>Customize this gift</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>

            {whatsappUrl && whatsappUrl !== '#' && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 font-semibold text-sm transition-colors flex items-center justify-center gap-2 tap-target"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Enquire on WhatsApp</span>
              </a>
            )}
          </div>

          {/* Full Description */}
          {gift.description && (
            <div className="space-y-2 pt-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                About this creation
              </h2>
              <div className="text-sm text-stone-700 leading-relaxed whitespace-pre-line font-sans">
                {gift.description}
              </div>
            </div>
          )}

          {/* What's Included */}
          {Array.isArray(gift.includes) && gift.includes.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-stone-100">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-800">
                <Package className="w-4 h-4 text-blush-600" />
                <span>What's Included</span>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-700">
                {gift.includes.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-stone-50/80 p-2.5 rounded-xl border border-stone-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Customization Options */}
          {Array.isArray(gift.customizationOptions) && gift.customizationOptions.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-stone-100">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-800">
                <Sliders className="w-4 h-4 text-gold-600" />
                <span>Customization Options Available</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {gift.customizationOptions.map((opt, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-xl bg-blush-50/80 border border-blush-100 text-xs font-medium text-blush-800"
                  >
                    ✨ {opt}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Suitable Occasions */}
          {Array.isArray(gift.occasions) && gift.occasions.length > 0 && (
            <div className="space-y-2.5 pt-3 border-t border-stone-100">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-800">
                <Calendar className="w-4 h-4 text-purple-600" />
                <span>Ideal For Occasions</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {gift.occasions.map((occ, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 text-xs font-medium"
                  >
                    {occ}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Delivery Information */}
          {gift.deliveryInfo && (
            <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-soft flex items-start gap-3">
              <Truck className="w-5 h-5 text-blush-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-stone-900 block">
                  Delivery & Crafting Timeline
                </span>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {gift.deliveryInfo}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky bottom "Customize this gift" bar on mobile only */}
      <motion.div
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="md:hidden fixed bottom-14 left-0 right-0 z-40 p-3 bg-white/95 backdrop-blur-md border-t border-blush-100 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]"
      >
        <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-medium">
              {gift.priceNote || 'Starts from'}
            </span>
            <span className="font-serif font-bold text-stone-900 text-base">
              {gift.startingPrice ? `₹${Number(gift.startingPrice).toLocaleString('en-IN')}` : 'Price on request'}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-1 justify-end">
            {whatsappUrl && whatsappUrl !== '#' && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Enquire on WhatsApp"
                className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 tap-target"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            )}
            <Link
              to={customizeUrl}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-blush-500 to-rose-600 text-white text-xs font-semibold shadow-soft flex items-center justify-center gap-1.5 active:scale-98 transition-transform"
            >
              <Gift className="w-4 h-4 text-gold-200" />
              <span>Customize</span>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
