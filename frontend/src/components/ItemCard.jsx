import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles, ArrowRight, Clock } from 'lucide-react';
import { getOptimizedImageUrl } from '../lib/images';

export function ItemCard({ item }) {
  const shouldReduceMotion = useReducedMotion();
  const rawImage = item?.images?.[0]?.url || '';
  const optimizedImage = getOptimizedImageUrl(rawImage, 600);

  const startingPrice = item?.startingPrice;
  const hasPrice = startingPrice !== null && startingPrice !== undefined && Number(startingPrice) > 0;
  const prepDays = item?.prepTimeDays;

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
      whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      whileHover={shouldReduceMotion ? {} : { y: -5, transition: { duration: 0.25, ease: 'easeOut' } }}
      whileTap={shouldReduceMotion ? {} : { scale: 0.98, transition: { duration: 0.15 } }}
      className="group bg-white rounded-3xl border border-blush-100/90 overflow-hidden shadow-soft hover:shadow-elevated transition-all flex flex-col justify-between"
    >
      <div>
        {/* 4:5 Aspect Ratio Image Container */}
        <Link
          to={`/items/${item.slug}`}
          className="relative aspect-[4/5] w-full block overflow-hidden bg-cream-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
          aria-label={`View details for ${item.title}`}
        >
          <img
            src={optimizedImage}
            alt={item.title || 'Handcrafted bespoke gift item'}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />

          {/* Badges Overlay */}
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-1.5 pointer-events-none">
            <span className="px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md text-[11px] font-semibold text-rose-700 shadow-xs border border-blush-100">
              {item.category || 'Bespoke'}
            </span>

            {item.isFeatured && (
              <span className="px-2.5 py-1 rounded-full bg-gold-400 text-stone-900 text-[10px] font-bold shadow-xs flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-stone-900" />
                Featured
              </span>
            )}
          </div>

          {/* Prep time chip bottom right on image */}
          {prepDays && prepDays > 0 ? (
            <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-full bg-stone-900/75 backdrop-blur-xs text-white text-[10px] font-medium flex items-center gap-1 shadow-xs pointer-events-none">
              <Clock className="w-2.5 h-2.5 text-gold-300" />
              <span>~{prepDays}d prep</span>
            </div>
          ) : null}
        </Link>

        {/* Content Details */}
        <div className="p-4 sm:p-5">
          <Link
            to={`/items/${item.slug}`}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 rounded-sm block"
          >
            <h3 className="font-serif text-base sm:text-lg font-bold text-stone-900 group-hover:text-rose-600 transition-colors line-clamp-2 min-h-[2.5rem] sm:min-h-[3rem] leading-snug">
              {item.title}
            </h3>
          </Link>

          {item.occasionTags && item.occasionTags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {item.occasionTags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] uppercase font-medium tracking-wider text-stone-400"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Card Footer: Price & Order Action */}
      <div className="p-4 sm:p-5 pt-3 border-t border-stone-100 flex items-center justify-between gap-2 bg-cream-50/40">
        <div className="min-w-0">
          {hasPrice ? (
            <>
              <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-medium">
                From
              </span>
              <span className="font-serif font-bold text-stone-900 text-base sm:text-lg whitespace-nowrap">
                ₹{Number(startingPrice).toLocaleString('en-IN')}
              </span>
            </>
          ) : (
            <>
              <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-medium">
                Pricing
              </span>
              <span className="font-serif font-semibold text-stone-700 text-xs sm:text-sm whitespace-nowrap">
                Price on request
              </span>
            </>
          )}
        </div>

        <Link
          to={`/items/${item.slug}`}
          className="inline-flex items-center justify-center gap-1 px-3 sm:px-4 py-2 rounded-xl bg-blush-50 hover:bg-blush-100 text-rose-700 text-xs font-semibold tracking-wide transition-all tap-target shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
          aria-label={`Order or view ${item.title}`}
        >
          <span>Order this</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </motion.div>
  );
}
