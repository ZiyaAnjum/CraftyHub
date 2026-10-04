import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';

export function GiftCard({ gift }) {
  const shouldReduceMotion = useReducedMotion();
  const primaryImage = gift.images?.[0]?.url || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80';

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
      whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      whileHover={shouldReduceMotion ? {} : { y: -5, transition: { duration: 0.25, ease: 'easeOut' } }}
      whileTap={shouldReduceMotion ? {} : { scale: 0.97, transition: { duration: 0.2 } }}
      className="group bg-white rounded-3xl border border-stone-200/80 overflow-hidden shadow-soft hover:shadow-elevated transition-shadow flex flex-col justify-between"
    >
      <div>
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
          <img
            src={primaryImage}
            alt={gift.title}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-xs text-[11px] font-semibold text-blush-700 shadow-xs border border-blush-100">
              {gift.category}
            </span>
            {gift.isFeatured && (
              <span className="px-2 py-0.5 rounded-full bg-gold-400 text-stone-900 text-[10px] font-bold shadow-xs flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-stone-900" />
                Featured
              </span>
            )}
          </div>
        </div>

        <div className="p-5">
          <h3 className="font-serif text-lg font-bold text-stone-900 group-hover:text-blush-600 transition-colors line-clamp-1">
            {gift.title}
          </h3>
          <p className="mt-1.5 text-xs text-stone-500 line-clamp-2 leading-relaxed">
            {gift.shortDescription || gift.description}
          </p>
        </div>
      </div>

      <div className="px-5 pb-5 pt-3 border-t border-stone-100 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-medium">
            {gift.priceNote || 'Price'}
          </span>
          <span className="font-serif font-bold text-stone-900 text-lg">
            ₹{Number(gift.price).toLocaleString('en-IN')}
          </span>
        </div>

        <Link
          to={`/gifts/${gift.slug}`}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blush-50 hover:bg-blush-100 text-blush-700 text-xs font-semibold transition-colors tap-target"
        >
          <span>View details</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </motion.div>
  );
}
