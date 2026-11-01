import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles, ArrowRight, Clock, Play, Pause, Film, Music } from 'lucide-react';
import { getOptimizedImageUrl } from '../lib/images';

export function TemplateCard({ template }) {
  const shouldReduceMotion = useReducedMotion();
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  const rawThumbnail = template?.thumbnailUrl || '';
  const optimizedThumbnail = rawThumbnail.includes('cloudinary')
    ? rawThumbnail.replace('/upload/', '/upload/w_600,f_auto,q_auto/')
    : getOptimizedImageUrl(rawThumbnail, 600);

  const handleMouseEnter = () => {
    if (shouldReduceMotion || videoError || !template?.previewVideoUrl) return;
    if (videoRef.current) {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const handlePlayToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (videoError || !template?.previewVideoUrl) return;

    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    }
  };

  const price = template?.basePrice;
  const deliveryDays = template?.deliveryDays || 2;

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
      whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      whileHover={shouldReduceMotion ? {} : { y: -5, transition: { duration: 0.25, ease: 'easeOut' } }}
      whileTap={shouldReduceMotion ? {} : { scale: 0.98, transition: { duration: 0.15 } }}
      className="group bg-white rounded-3xl border border-blush-100/90 overflow-hidden shadow-soft hover:shadow-elevated transition-all flex flex-col justify-between"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div>
        {/* 9:16 Aspect Ratio Video Preview Container */}
        <Link
          to={`/templates/${template.slug}`}
          className="relative aspect-[9/16] w-full block overflow-hidden bg-cream-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
          aria-label={`View and customize video template: ${template.title}`}
        >
          {/* Static Poster Image */}
          <img
            src={optimizedThumbnail}
            alt={template.title || 'Video invitation template preview'}
            className={`w-full h-full object-cover object-center transition-all duration-500 ease-out ${
              isPlaying && videoLoaded ? 'opacity-0' : 'opacity-100 group-hover:scale-105'
            }`}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src =
                'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80';
            }}
          />

          {/* Interactive Preview Video */}
          {!videoError && template.previewVideoUrl ? (
            <video
              ref={videoRef}
              src={template.previewVideoUrl}
              preload="none"
              muted
              playsInline
              loop
              onLoadedData={() => setVideoLoaded(true)}
              onError={() => setVideoError(true)}
              className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-300 ${
                isPlaying && videoLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ) : null}

          {/* Video Play/Pause Tap Button for Mobile or Click */}
          {!videoError && template.previewVideoUrl ? (
            <button
              type="button"
              onClick={handlePlayToggle}
              aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
              className="absolute bottom-3 left-3 w-8 h-8 rounded-full bg-stone-900/80 hover:bg-stone-900 text-white flex items-center justify-center backdrop-blur-xs transition-all shadow-md z-10 tap-target"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>
          ) : null}

          {/* Top Badges Overlay */}
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-1.5 pointer-events-none z-10">
            <span className="px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md text-[11px] font-semibold text-rose-700 shadow-xs border border-blush-100">
              {template.category || 'Video'}
            </span>

            {template.isFeatured && (
              <span className="px-2.5 py-1 rounded-full bg-gold-400 text-stone-900 text-[10px] font-bold shadow-xs flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-stone-900" />
                Featured
              </span>
            )}
          </div>

          {/* Bottom Right Chips */}
          <div className="absolute bottom-3 right-3 flex flex-col items-end gap-1.5 pointer-events-none z-10">
            <div className="px-2 py-0.5 rounded-full bg-stone-900/80 backdrop-blur-xs text-white text-[10px] font-medium flex items-center gap-1 shadow-xs">
              <Clock className="w-2.5 h-2.5 text-gold-300" />
              <span>~{deliveryDays}d turnaround</span>
            </div>
            <div className="px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-xs text-stone-700 text-[9px] font-semibold tracking-wider uppercase shadow-xs">
              {template.aspectRatio || '9:16'} HD
            </div>
          </div>
        </Link>

        {/* Content Details */}
        <div className="p-4 sm:p-5">
          <Link
            to={`/templates/${template.slug}`}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 rounded-sm block"
          >
            <h3 className="font-serif text-base sm:text-lg font-bold text-stone-900 group-hover:text-rose-600 transition-colors line-clamp-2 leading-snug">
              {template.title}
            </h3>
          </Link>

          {template.sampleAudioTitle ? (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-stone-500 line-clamp-1">
              <Music className="w-3 h-3 text-gold-600 shrink-0" />
              <span className="truncate">{template.sampleAudioTitle}</span>
            </div>
          ) : (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-stone-400">
              <Film className="w-3 h-3 text-rose-400 shrink-0" />
              <span>Custom text, audio & colors</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Footer: Price & Order Action */}
      <div className="p-4 sm:p-5 pt-3 border-t border-stone-100 flex items-center justify-between gap-2 bg-cream-50/40">
        <div className="min-w-0">
          <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-medium">
            Price
          </span>
          <span className="font-serif font-bold text-stone-900 text-base sm:text-lg whitespace-nowrap">
            ₹{Number(price || 0).toLocaleString('en-IN')}
          </span>
        </div>

        <Link
          to={`/templates/${template.slug}`}
          className="inline-flex items-center justify-center gap-1 px-3 sm:px-4 py-2 rounded-xl bg-blush-50 hover:bg-blush-100 text-rose-700 text-xs font-semibold tracking-wide transition-all tap-target shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
          aria-label={`View and customize ${template.title}`}
        >
          <span>View / Order</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </motion.div>
  );
}
