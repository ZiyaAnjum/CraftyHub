import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Package,
  Sliders,
  Calendar,
  Clock,
  MessageCircle,
  Share2,
  Check,
  AlertCircle,
  ZoomIn,
  X,
  ChevronLeft,
  ChevronRight,
  Gift
} from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { Skeleton } from '../components/Skeleton';
import { ItemCard } from '../components/ItemCard';
import { getShopWhatsAppUrl } from '../lib/whatsapp';
import { getOptimizedImageUrl } from '../lib/images';

export function ItemDetailPage() {
  const shouldReduceMotion = useReducedMotion();
  const { slug } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [relatedItems, setRelatedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Lightbox & sharing state
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Mobile swipe gesture tracking
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setNotFound(false);
    setError(null);
    setActiveImageIndex(0);

    async function fetchItemAndRelated() {
      try {
        const data = await api.get(`/api/items/${slug}`);
        if (!isMounted) return;

        const foundItem = data?.item || data?.gift;
        if (!foundItem) {
          setNotFound(true);
          return;
        }

        setItem(foundItem);

        // Update document title and meta description for SEO
        document.title = `${foundItem.title} | Fouzas Creation Boutique Gifting`;
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
          metaDesc = document.createElement('meta');
          metaDesc.name = 'description';
          document.head.appendChild(metaDesc);
        }
        metaDesc.content = foundItem.description
          ? foundItem.description.slice(0, 160)
          : `Customized ${foundItem.category} handcrafted by Fouzas Creation in Bengaluru. Order bespoke gifts.`;

        // Fetch related items from the same category
        if (foundItem.category) {
          try {
            const relRes = await api.get(`/api/items?category=${encodeURIComponent(foundItem.category)}&limit=5`);
            if (isMounted) {
              const others = (relRes.items || [])
                .filter((i) => String(i._id || i.id) !== String(foundItem._id || foundItem.id))
                .slice(0, 4);
              setRelatedItems(others);
            }
          } catch {
            // Non-critical
          }
        }
      } catch (err) {
        if (isMounted) {
          if (err instanceof ApiError && err.status === 404) {
            setNotFound(true);
          } else {
            setError(err.message || 'Failed to load item details.');
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (slug) {
      fetchItemAndRelated();
    }

    return () => {
      isMounted = false;
      // Reset title on unmount
      document.title = 'Fouzas Creation | Made for your special moments';
    };
  }, [slug]);

  // Handle mobile swipe gestures
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isSwipe = Math.abs(distance) > 50;

    if (isSwipe && item?.images?.length > 1) {
      if (distance > 0) {
        // Swiped Left -> Next Image
        setActiveImageIndex((prev) => (prev + 1) % item.images.length);
      } else {
        // Swiped Right -> Prev Image
        setActiveImageIndex((prev) => (prev - 1 + item.images.length) % item.images.length);
      }
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Handle share / copy link
  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: item?.title || 'Fouzas Creation',
          text: `Check out ${item?.title} on Fouzas Creation!`,
          url,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      } catch {
        // Ignore
      }
    }
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isLightboxOpen) return;
      if (e.key === 'Escape') setIsLightboxOpen(false);
      if (e.key === 'ArrowRight' && item?.images?.length) {
        setActiveImageIndex((prev) => (prev + 1) % item.images.length);
      }
      if (e.key === 'ArrowLeft' && item?.images?.length) {
        setActiveImageIndex((prev) => (prev - 1 + item.images.length) % item.images.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, item]);

  // Loading skeleton state
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
        <Skeleton className="h-5 w-32 rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          <div className="space-y-4">
            <Skeleton className="aspect-[4/5] w-full rounded-3xl" />
            <div className="flex gap-3">
              <Skeleton className="w-20 h-20 rounded-2xl" />
              <Skeleton className="w-20 h-20 rounded-2xl" />
              <Skeleton className="w-20 h-20 rounded-2xl" />
            </div>
          </div>
          <div className="space-y-6">
            <Skeleton className="h-4 w-28 rounded-full" />
            <Skeleton className="h-10 w-4/5 rounded-xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // 404 state when item is hidden or missing
  if (notFound) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 sm:py-24 text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 mx-auto flex items-center justify-center shadow-xs">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
          Creation Not Found
        </h1>
        <p className="text-stone-600 text-xs sm:text-sm leading-relaxed max-w-sm mx-auto">
          The requested bespoke creation could not be found or may currently be unavailable. Explore our full collection to discover more handcrafted designs.
        </p>
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/explore"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-rose-600 text-white font-semibold text-sm shadow-rose-glow hover:bg-rose-700 transition-colors"
          >
            Browse Collection
          </Link>
          <Link
            to="/"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white border border-stone-200 text-stone-700 font-semibold text-sm hover:bg-stone-50 transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-stone-900">Unable to load creation</h2>
        <p className="text-xs sm:text-sm text-stone-500">{error || 'Please try again in a few moments.'}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 rounded-xl bg-rose-600 text-white text-xs sm:text-sm font-semibold hover:bg-rose-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const images = item.images && item.images.length > 0
    ? item.images
    : [{ url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80', publicId: '' }];

  const activeImage = images[activeImageIndex] || images[0];
  const activeOptimizedImage = getOptimizedImageUrl(activeImage.url, 1200);

  const startingPrice = item.startingPrice;
  const hasPrice = startingPrice !== null && startingPrice !== undefined && Number(startingPrice) > 0;
  const prepDays = item.prepTimeDays;

  const customizeUrl = `/create?item=${item._id || item.id || ''}`;
  const whatsappMessage = `Hello Fouzas Creation! I would love to enquire about customizing "${item.title}" (${window.location.href}).`;
  const whatsappUrl = getShopWhatsAppUrl(whatsappMessage);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-10 sm:space-y-14 pb-28 md:pb-12">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-medium text-stone-500">
        <Link to="/explore" className="inline-flex items-center gap-1 hover:text-rose-600 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Explore</span>
        </Link>
        <span>/</span>
        <Link
          to={`/explore?category=${encodeURIComponent(item.category || '')}`}
          className="hover:text-rose-600 transition-colors"
        >
          {item.category || 'Bespoke'}
        </Link>
        <span>/</span>
        <span className="text-stone-800 font-semibold truncate max-w-[220px]">{item.title}</span>
      </nav>

      {/* Main Product Layout: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-start">
        {/* Left: Responsive Image Gallery with Touch Swipe and Lightbox */}
        <div className="space-y-4">
          {/* Main 4:5 Image Display */}
          <div
            className="relative aspect-[4/5] w-full rounded-3xl overflow-hidden bg-cream-100 border border-blush-100 shadow-soft select-none group"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={activeImage.url}
                src={getOptimizedImageUrl(activeImage.url, 900)}
                alt={`${item.title} - view ${activeImageIndex + 1}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="w-full h-full object-cover object-center cursor-zoom-in"
                onClick={() => setIsLightboxOpen(true)}
              />
            </AnimatePresence>

            {/* Badges on top */}
            <div className="absolute top-4 left-4 flex flex-wrap gap-2 pointer-events-none">
              <span className="px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-xs font-bold text-rose-700 shadow-xs border border-blush-100">
                {item.category}
              </span>
              {item.isFeatured && (
                <span className="px-2.5 py-1 rounded-full bg-gold-400 text-stone-900 text-xs font-bold shadow-xs flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-stone-900" />
                  Featured
                </span>
              )}
            </div>

            {/* Zoom / Lightbox Trigger Button */}
            <button
              type="button"
              onClick={() => setIsLightboxOpen(true)}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-white/90 backdrop-blur-md hover:bg-white text-stone-700 hover:text-stone-900 shadow-soft transition-all tap-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
              title="Click to zoom image"
              aria-label="Zoom image"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            {/* Mobile Swipe Indicators (when multiple images) */}
            {images.length > 1 && (
              <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-xs">
                {images.map((_, idx) => (
                  <span
                    key={idx}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === activeImageIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Thumbnails Row */}
          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-20 h-24 rounded-2xl overflow-hidden shrink-0 border-2 transition-all tap-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${
                    activeImageIndex === idx
                      ? 'border-rose-600 ring-2 ring-rose-200'
                      : 'border-transparent opacity-75 hover:opacity-100'
                  }`}
                  aria-label={`Select image ${idx + 1}`}
                >
                  <img
                    src={getOptimizedImageUrl(img.url, 200)}
                    alt={`${item.title} thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover object-center"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Item Details & Actions */}
        <div className="space-y-6">
          {/* Header Title & Tags */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
                Fouzas Creation Studio
              </span>
              {item.occasionTags && item.occasionTags.length > 0 && (
                <>
                  <span className="text-stone-300">•</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {item.occasionTags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 text-[11px] font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>

            <h1 className="font-serif text-2xl sm:text-4xl font-bold text-stone-900 leading-tight">
              {item.title}
            </h1>
          </div>

          {/* Price & Prep Time Box */}
          <div className="p-5 rounded-2xl bg-cream-100/80 border border-gold-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 block">
                {hasPrice ? 'Starting Price' : 'Bespoke Quote'}
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                {hasPrice ? (
                  <>
                    <span className="font-serif text-3xl font-bold text-stone-900">
                      ₹{Number(startingPrice).toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-stone-500 font-medium">+ customization</span>
                  </>
                ) : (
                  <span className="font-serif text-2xl font-bold text-stone-900">
                    Price on request
                  </span>
                )}
              </div>
            </div>

            {prepDays && prepDays > 0 ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-stone-700 text-xs font-medium self-start sm:self-auto shadow-xs">
                <Clock className="w-3.5 h-3.5 text-gold-600" />
                <span>Usually ready in about {prepDays} {prepDays === 1 ? 'day' : 'days'}</span>
              </div>
            ) : null}
          </div>

          {/* Ready-By Estimate (Phase 6) */}
          {(() => {
            const estimatedDays = Number(prepDays) > 0 ? Number(prepDays) : 3;
            const estimatedReadyDate = new Date(Date.now() + estimatedDays * 24 * 60 * 60 * 1000);
            const formattedEstimatedDate = new Intl.DateTimeFormat('en-IN', {
              timeZone: 'Asia/Kolkata',
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            }).format(estimatedReadyDate);

            return (
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3 text-xs shadow-xs">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Calendar className="w-4 h-4 text-amber-700" />
                </div>
                <div className="space-y-0.5">
                  <div className="font-semibold text-stone-900">
                    Estimated Ready Date: <span className="text-amber-900 font-bold">{formattedEstimatedDate}</span>
                    <span className="text-stone-500 font-normal ml-1">
                      (~{estimatedDays} {estimatedDays === 1 ? 'day' : 'days'} crafting estimate)
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    Handcrafted to order. Final readiness date will be confirmed by our artisan upon receiving your specifications.
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Primary & Secondary Action CTAs */}
          <div className="space-y-3 pt-1">
            <Link
              to={customizeUrl}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-600 via-blush-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-semibold text-base shadow-elevated transition-all flex items-center justify-center gap-2 tap-target transform active:scale-98 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
            >
              <Gift className="w-5 h-5 text-gold-200" />
              <span>Customize This Creation</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>

            <div className="grid grid-cols-2 gap-3">
              {/* WhatsApp Enquiry Button */}
              {whatsappUrl && whatsappUrl !== '#' ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 px-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 tap-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>Enquire on WhatsApp</span>
                </a>
              ) : null}

              {/* Share & Copy Link Button */}
              <button
                type="button"
                onClick={handleShare}
                className="py-3 px-3 rounded-2xl bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 tap-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 text-stone-500" />
                    <span>Share Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Full Description */}
          {item.description && (
            <div className="space-y-2 pt-3 border-t border-stone-200">
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-600">
                About this creation
              </h2>
              <div className="text-sm text-stone-700 leading-relaxed whitespace-pre-line font-sans">
                {item.description}
              </div>
            </div>
          )}

          {/* Customization Options Preview List */}
          {Array.isArray(item.customizationOptions) && item.customizationOptions.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-stone-200">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-800">
                <Sliders className="w-4 h-4 text-gold-600" />
                <span>Personalization Available</span>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {item.customizationOptions.map((opt, idx) => (
                  <li
                    key={idx}
                    className="p-3 rounded-xl bg-white border border-blush-200/90 shadow-xs flex items-center justify-between gap-2"
                  >
                    <span className="text-xs font-semibold text-stone-800">
                      {typeof opt === 'string' ? opt : opt.label}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blush-50 text-rose-700 border border-blush-200">
                      {typeof opt === 'string' ? 'Custom' : opt.type || 'Choice'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Related Items Section */}
      {relatedItems.length > 0 && (
        <section className="space-y-6 pt-10 border-t border-stone-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
                More in {item.category}
              </h2>
              <p className="text-xs text-stone-500">
                Complementary handcrafted creations you may adore
              </p>
            </div>

            <Link
              to={`/explore?category=${encodeURIComponent(item.category)}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {relatedItems.map((rel) => (
              <ItemCard key={`rel-${rel._id || rel.id}`} item={rel} />
            ))}
          </div>
        </section>
      )}

      {/* Lightbox Modal */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6"
            onClick={() => setIsLightboxOpen(false)}
          >
            {/* Top Toolbar */}
            <div className="w-full flex items-center justify-between text-white max-w-5xl z-10">
              <span className="text-xs sm:text-sm font-semibold text-stone-300">
                {item.title} ({activeImageIndex + 1} of {images.length})
              </span>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white tap-target transition-colors"
                aria-label="Close zoom view"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Centered Image with Next/Prev Buttons */}
            <div
              className="relative max-w-4xl max-h-[80vh] flex items-center justify-center my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={activeOptimizedImage}
                alt={item.title}
                className="max-h-[75vh] max-w-full rounded-2xl object-contain shadow-2xl"
              />

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
                    }}
                    className="absolute left-2 sm:-left-12 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex((prev) => (prev + 1) % images.length);
                    }}
                    className="absolute right-2 sm:-right-12 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            {/* Bottom thumbnail strip in Lightbox */}
            {images.length > 1 && (
              <div
                className="flex items-center gap-2 overflow-x-auto pb-2 max-w-md z-10"
                onClick={(e) => e.stopPropagation()}
              >
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                      idx === activeImageIndex ? 'border-rose-500 scale-105' : 'border-transparent opacity-60'
                    }`}
                  >
                    <img src={img.url} alt="thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Sticky Bottom Action Bar (Fixed above bottom nav at bottom-14) */}
      <motion.div
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="md:hidden fixed bottom-14 left-0 right-0 z-30 p-3 bg-white/95 backdrop-blur-md border-t border-blush-100 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]"
      >
        <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-medium">
              {hasPrice ? 'Starting from' : 'Pricing'}
            </span>
            <span className="font-serif font-bold text-stone-900 text-base">
              {hasPrice ? `₹${Number(startingPrice).toLocaleString('en-IN')}` : 'Price on request'}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-1 justify-end">
            <Link
              to={customizeUrl}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-blush-600 text-white text-xs font-semibold shadow-soft flex items-center justify-center gap-1.5 active:scale-98 transition-transform"
            >
              <Gift className="w-4 h-4 text-gold-200" />
              <span>Customize This</span>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
