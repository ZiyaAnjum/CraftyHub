import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Clock,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Music,
  Film,
  CheckCircle2,
  Share2,
  Check,
  MessageCircle,
  AlertCircle,
  RotateCcw,
  ShieldCheck,
  Layers
} from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { TemplateCard } from '../components/TemplateCard';
import { VideoOrderModal } from '../components/VideoOrderModal';
import { Skeleton } from '../components/Skeleton';
import { getShopWhatsAppUrl } from '../lib/whatsapp';
import { getSafeNextPath } from '../lib/safeNext';

export function TemplateDetailPage() {
  const shouldReduceMotion = useReducedMotion();
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const videoRef = useRef(null);

  const [template, setTemplate] = useState(null);
  const [relatedTemplates, setRelatedTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(null);

  // Video player controls
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);

  // Order Customization Modal State
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  // Sharing & Toast
  const [copiedLink, setCopiedLink] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Automatically open order modal if returning from signin redirect
  useEffect(() => {
    if (template && searchParams.get('order') === 'true') {
      if (user) {
        setIsOrderModalOpen(true);
        // Remove the ?order=true flag from the URL after the drawer opens
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete('order');
        setSearchParams(nextParams, { replace: true });
      }
    }
  }, [template, searchParams, user, setSearchParams]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setNotFound(false);
    setError(null);
    setIsPlaying(false);
    setIsMuted(true);
    setVideoLoaded(false);
    setVideoError(false);

    async function fetchTemplateData() {
      try {
        const data = await api.get(`/api/templates/${slug}`);
        if (!isMounted) return;

        const found = data?.template;
        if (!found) {
          setNotFound(true);
          return;
        }

        setTemplate(found);

        // SEO meta
        document.title = `${found.title} | Video Invitation | Fouzas Creation`;
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
          metaDesc = document.createElement('meta');
          metaDesc.name = 'description';
          document.head.appendChild(metaDesc);
        }
        metaDesc.content = found.description
          ? found.description.slice(0, 160)
          : `Customized video invitation handcrafted by Fouzas Creation. Turnaround: ${found.deliveryDays || 2} days.`;

        // Fetch related templates from same category
        try {
          const relData = await api.get(`/api/templates?category=${encodeURIComponent(found.category)}`);
          if (isMounted) {
            const others = (relData.templates || [])
              .filter((t) => String(t._id || t.id) !== String(found._id || found.id))
              .slice(0, 4);
            setRelatedTemplates(others);
          }
        } catch {
          // non-blocking
        }
      } catch (err) {
        if (isMounted) {
          if (err instanceof ApiError && err.status === 404) {
            setNotFound(true);
          } else {
            setError(err.message || 'Failed to load video template.');
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (slug) {
      fetchTemplateData();
    }

    return () => {
      isMounted = false;
      document.title = 'Fouzas Creation | Made for your special moments';
    };
  }, [slug]);

  // Video play/pause toggle
  const togglePlay = () => {
    if (videoError || !template?.previewVideoUrl || !videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  // Video mute/unmute toggle
  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  // Share / Copy link
  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: template?.title || 'Fouzas Creation Video Template',
          text: `Check out ${template?.title} on Fouzas Creation!`,
          url,
        });
        return;
      } catch {
        // fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      showToast('Template link copied to clipboard!');
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {
      showToast('Could not copy link automatically.', 'error');
    }
  };

  // Order with this template action (Segment 4 customer video order flow)
  const handleOrderClick = () => {
    if (!user) {
      const target = `/templates/${encodeURIComponent(template.slug)}?order=true`;
      const safeTarget = getSafeNextPath(target);
      navigate(`/signin?next=${encodeURIComponent(safeTarget)}`);
      return;
    }
    setIsOrderModalOpen(true);
  };

  const whatsappInquiryUrl = template
    ? getShopWhatsAppUrl(
        `Hello Fouzas Creation, I am interested in ordering the video template: "${template.title}" (₹${template.basePrice}).`
      )
    : '#';

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-16 rounded" />
          <span className="text-stone-300">/</span>
          <Skeleton className="h-4 w-28 rounded" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <div className="lg:col-span-5">
            <Skeleton className="aspect-[9/16] w-full max-w-md mx-auto rounded-3xl" />
          </div>
          <div className="lg:col-span-7 space-y-5">
            <Skeleton className="h-6 w-32 rounded-full" />
            <Skeleton className="h-10 w-3/4 rounded-lg" />
            <Skeleton className="h-8 w-40 rounded-lg" />
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-44 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !template) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-cream-100 text-stone-400 flex items-center justify-center mx-auto">
          <Film className="w-8 h-8 text-rose-400" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-stone-900">
          Video Template Not Found
        </h1>
        <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
          The video template you are looking for may have been updated, unpublished, or does not exist.
        </p>
        <div className="pt-2">
          <Link
            to="/templates"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-blush-600 hover:from-rose-700 hover:to-blush-700 text-white font-semibold text-sm shadow-soft transition-all tap-target"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Browse All Templates</span>
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-stone-900">
          Something went wrong
        </h1>
        <p className="text-stone-600 text-sm sm:text-base">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm transition-all tap-target"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reload Page</span>
        </button>
      </div>
    );
  }

  const rawThumbnail = template.thumbnailUrl || '';
  const optimizedThumbnail = rawThumbnail.includes('cloudinary')
    ? rawThumbnail.replace('/upload/', '/upload/w_900,f_auto,q_auto/')
    : rawThumbnail;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-12">
      {/* Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed bottom-24 right-4 z-50 px-4 py-3 rounded-2xl shadow-elevated flex items-center gap-2 text-sm font-medium ${
              toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-stone-900 text-white'
            }`}
          >
            {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <Sparkles className="w-4 h-4 text-gold-400" />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm text-stone-500 font-medium">
        <Link to="/" className="hover:text-rose-600 transition-colors">
          Home
        </Link>
        <span className="text-stone-300">/</span>
        <Link to="/templates" className="hover:text-rose-600 transition-colors">
          Video Templates
        </Link>
        <span className="text-stone-300">/</span>
        <span className="text-stone-800 truncate max-w-xs">{template.title}</span>
      </nav>

      {/* 2. Main Detail Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: 9:16 Vertical Video Player (Sticky on Desktop) */}
        <div className="lg:col-span-5 lg:sticky lg:top-28">
          <div className="relative aspect-[9/16] w-full max-w-md mx-auto rounded-3xl overflow-hidden bg-stone-900 shadow-elevated border border-blush-200">
            {/* Poster Thumbnail */}
            <img
              src={optimizedThumbnail}
              alt={template.title}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                isPlaying && videoLoaded ? 'opacity-0' : 'opacity-100'
              }`}
              onError={(e) => {
                e.currentTarget.src =
                  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80';
              }}
            />

            {/* Video Player */}
            {!videoError && template.previewVideoUrl ? (
              <video
                ref={videoRef}
                src={template.previewVideoUrl}
                preload="none"
                muted={isMuted}
                playsInline
                loop
                onLoadedData={() => setVideoLoaded(true)}
                onError={() => setVideoError(true)}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                  isPlaying && videoLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />
            ) : null}

            {/* Center Big Play Button (when paused) */}
            {!isPlaying && !videoError && template.previewVideoUrl ? (
              <button
                type="button"
                onClick={togglePlay}
                aria-label="Play video preview"
                className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-rose-600/90 hover:bg-rose-600 text-white flex items-center justify-center shadow-rose-glow backdrop-blur-sm transition-all transform hover:scale-110 active:scale-95"
              >
                <Play className="w-8 h-8 fill-current ml-1" />
              </button>
            ) : null}

            {/* Bottom Controls Bar on Video Overlay */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-auto">
              {!videoError && template.previewVideoUrl ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={togglePlay}
                    aria-label={isPlaying ? 'Pause video' : 'Play video'}
                    className="w-9 h-9 rounded-full bg-stone-900/80 hover:bg-stone-900 text-white flex items-center justify-center backdrop-blur-md transition-all shadow-md tap-target"
                  >
                    {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={toggleMute}
                    aria-label={isMuted ? 'Unmute video audio' : 'Mute video audio'}
                    className="w-9 h-9 rounded-full bg-stone-900/80 hover:bg-stone-900 text-white flex items-center justify-center backdrop-blur-md transition-all shadow-md tap-target"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-gold-400" />}
                  </button>
                </div>
              ) : (
                <div className="px-3 py-1 rounded-full bg-stone-900/80 text-white text-xs backdrop-blur-md">
                  Preview Poster
                </div>
              )}

              <span className="px-2.5 py-1 rounded-full bg-stone-900/80 text-stone-200 text-xs font-semibold backdrop-blur-md">
                {template.aspectRatio || '9:16'} HD
              </span>
            </div>
          </div>

          {/* Sample Audio Indicator */}
          {template.sampleAudioTitle && (
            <div className="mt-3 max-w-md mx-auto p-3 rounded-2xl bg-cream-100/80 border border-blush-100 flex items-center gap-2.5 text-xs text-stone-700">
              <Music className="w-4 h-4 text-gold-600 shrink-0" />
              <div className="truncate">
                <span className="font-semibold text-stone-900">Featured Audio Track: </span>
                <span className="text-stone-600">{template.sampleAudioTitle}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Template Info, Inclusions, and Order CTA */}
        <div className="lg:col-span-7 space-y-6 sm:space-y-8">
          {/* Header & Badges */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {template.category}
              </span>
              {template.isFeatured && (
                <span className="px-3 py-1 rounded-full bg-gold-400 text-stone-900 text-xs font-bold flex items-center gap-1 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                  Featured Template
                </span>
              )}
              <span className="px-3 py-1 rounded-full bg-stone-100 text-stone-700 text-xs font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-stone-500" />
                ~{template.deliveryDays || 2} Days Turnaround
              </span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 leading-tight">
              {template.title}
            </h1>
          </div>

          {/* Pricing Highlight Bar */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-cream-100 via-blush-50 to-cream-50 border border-blush-200 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-stone-500 block">
                Standard Customization Price
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
                  ₹{Number(template.basePrice || 0).toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-stone-500 font-medium">all included</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleShare}
                className="p-2.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-600 hover:text-stone-900 transition-colors shadow-xs tap-target"
                title="Share this template"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
              </button>
              <a
                href={whatsappInquiryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-emerald-600 hover:text-emerald-700 transition-colors shadow-xs tap-target"
                title="Inquire on WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3 text-stone-700 text-sm sm:text-base leading-relaxed">
            <h3 className="font-serif text-lg font-bold text-stone-900">About This Video Template</h3>
            <p className="whitespace-pre-line">{template.description}</p>
          </div>

          {/* What's Included */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-blush-100 shadow-soft space-y-4">
            <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-rose-600" />
              <span>What's Included With Every Order</span>
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-stone-700">
              {(template.whatsIncluded && template.whatsIncluded.length > 0
                ? template.whatsIncluded
                : [
                    'Full HD 1080p MP4 Video File',
                    'Custom Names, Dates & Venue Inscriptions',
                    'Custom Music / Audio Synchronization',
                    'Up to 2 Rounds of Minor Text Edits',
                    'Digital Delivery via Cloud Drive Link',
                  ]
              ).map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* How It Works Timeline */}
          <div className="p-5 sm:p-6 rounded-3xl bg-cream-100/60 border border-cream-200 space-y-4">
            <h3 className="font-serif text-base font-bold text-stone-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-gold-600" />
              <span>How The Process Works</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs text-stone-600">
              <div className="space-y-1 p-3 rounded-2xl bg-white/80 border border-stone-200/60">
                <span className="font-bold text-rose-600 block">1. Select Style</span>
                <span>Choose as-is or request slight color/text changes.</span>
              </div>
              <div className="space-y-1 p-3 rounded-2xl bg-white/80 border border-stone-200/60">
                <span className="font-bold text-rose-600 block">2. Event Details</span>
                <span>Provide on-screen names, date, venue & photos.</span>
              </div>
              <div className="space-y-1 p-3 rounded-2xl bg-white/80 border border-stone-200/60">
                <span className="font-bold text-rose-600 block">3. Draft Review</span>
                <span>We share a video preview within 48 hours for your approval.</span>
              </div>
              <div className="space-y-1 p-3 rounded-2xl bg-white/80 border border-stone-200/60">
                <span className="font-bold text-rose-600 block">4. Final HD Video</span>
                <span>Download your full HD video ready for WhatsApp & Instagram.</span>
              </div>
            </div>
          </div>

          {/* Primary CTA Buttons */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={handleOrderClick}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-600 to-blush-600 hover:from-rose-700 hover:to-blush-700 text-white font-semibold text-base shadow-rose-glow flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0 tap-target"
            >
              <span>Order With This Template</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-center gap-2 text-xs text-stone-500 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>100% Satisfaction Guarantee • Minor Revisions Included</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Related Video Templates Section */}
      {relatedTemplates.length > 0 && (
        <div className="pt-10 border-t border-blush-100 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-2xl font-bold text-stone-900">
                More in {template.category}
              </h2>
              <p className="text-xs sm:text-sm text-stone-500">
                Discover more handcrafted video templates for your occasion
              </p>
            </div>
            <Link
              to={`/templates?category=${encodeURIComponent(template.category)}`}
              className="text-xs sm:text-sm font-semibold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1 tap-target"
            >
              <span>View all</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {relatedTemplates.map((tpl) => (
              <TemplateCard key={tpl._id || tpl.id} template={tpl} />
            ))}
          </div>
        </div>
      )}

      {/* Video Customization & Order Drawer */}
      <VideoOrderModal
        isOpen={isOrderModalOpen}
        onClose={() => {
          setIsOrderModalOpen(false);
          if (searchParams.get('order')) {
            const nextParams = new URLSearchParams(searchParams);
            nextParams.delete('order');
            setSearchParams(nextParams, { replace: true });
          }
        }}
        template={template}
      />
    </div>
  );
}
