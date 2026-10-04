import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Sparkles,
  Heart,
  Gift,
  Cake,
  Calendar,
  ChevronRight,
  Award,
  ShieldCheck,
  Smile,
  Package,
  ArrowRight,
  Image as ImageIcon
} from 'lucide-react';
import { api } from '../lib/api';
import { stagger, fadeUp } from '../lib/motion';
import { GiftCard } from '../components/GiftCard';
import { GiftCardSkeleton } from '../components/Skeleton';

const OCCASIONS = [
  {
    id: 'birthday',
    title: 'Birthday',
    description: 'Personalized surprises, age plaques, and joy-filled hampers.',
    icon: Cake,
    gradient: 'from-pink-100 to-rose-100 border-rose-200/60',
    accent: 'text-rose-600',
    tag: 'Most Popular',
  },
  {
    id: 'engagement',
    title: 'Engagement',
    description: 'Ring platters, keepsake frames, and elegant couple hampers.',
    icon: Sparkles,
    gradient: 'from-amber-50 to-orange-100/60 border-amber-200/60',
    accent: 'text-amber-600',
    tag: 'Bespoke',
  },
  {
    id: 'wedding',
    title: 'Wedding',
    description: 'Grand trousseau packing, welcome hampers, and memorable tokens.',
    icon: Heart,
    gradient: 'from-red-50 to-pink-100/60 border-pink-200/60',
    accent: 'text-blush-600',
    tag: 'Luxury',
  },
  {
    id: 'anniversary',
    title: 'Anniversary',
    description: 'Celebrate lasting love with customized photo frames and chocolate boxes.',
    icon: Calendar,
    gradient: 'from-purple-50 to-pink-50 border-purple-200/60',
    accent: 'text-purple-600',
    tag: 'Cherished',
  },
];

const SHOP_CATEGORIES = [
  {
    category: 'Hamper',
    title: 'Luxury Hampers',
    subtitle: 'Curated gift boxes with artisanal treats & candles',
    icon: Package,
    gradient: 'from-amber-50 to-orange-50 border-amber-200/70',
    accent: 'text-amber-700 bg-amber-100/80',
  },
  {
    category: 'Bouquet',
    title: 'Handcrafted Bouquets',
    subtitle: 'Everlasting floral arrangements & satin ribbons',
    icon: Sparkles,
    gradient: 'from-rose-50 to-pink-50 border-pink-200/70',
    accent: 'text-rose-700 bg-rose-100/80',
  },
  {
    category: 'Frame',
    title: 'Memory Frames',
    subtitle: 'Custom wooden, acrylic & LED backlit portraits',
    icon: ImageIcon,
    gradient: 'from-indigo-50 to-blue-50 border-indigo-200/70',
    accent: 'text-indigo-700 bg-indigo-100/80',
  },
  {
    category: 'Engraved',
    title: 'Engraved Plaques',
    subtitle: 'Laser-etched keepsake clocks & desk decor',
    icon: Award,
    gradient: 'from-emerald-50 to-teal-50 border-emerald-200/70',
    accent: 'text-emerald-700 bg-emerald-100/80',
  },
  {
    category: 'Other',
    title: 'Bespoke Creations',
    subtitle: 'Personalized tokens and celebration favors',
    icon: Gift,
    gradient: 'from-purple-50 to-fuchsia-50 border-purple-200/70',
    accent: 'text-purple-700 bg-purple-100/80',
  },
];

export function HomePage() {
  const shouldReduceMotion = useReducedMotion();
  const [featuredGifts, setFeaturedGifts] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadFeatured() {
      try {
        const res = await api.get('/api/gifts/featured');
        if (isMounted) {
          setFeaturedGifts(res.gifts || []);
        }
      } catch {
        // fail silently for home page featured
      } finally {
        if (isMounted) setLoadingFeatured(false);
      }
    }
    loadFeatured();
    return () => {
      isMounted = false;
    };
  }, []);

  const containerVariants = shouldReduceMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
      }
    : stagger;

  const itemVariants = shouldReduceMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
      }
    : fadeUp;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-14 sm:space-y-20">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blush-50 via-cream-100 to-gold-50/70 border border-blush-200/60 p-6 sm:p-12 shadow-soft text-center sm:text-left">
        {/* Softly floating background shapes (3 max, transform only) */}
        <motion.div
          className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-blush-200/40 blur-2xl pointer-events-none"
          animate={shouldReduceMotion ? {} : {
            x: [0, 15, -10, 0],
            y: [0, -15, 10, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-gold-200/30 blur-2xl pointer-events-none"
          animate={shouldReduceMotion ? {} : {
            x: [0, -12, 14, 0],
            y: [0, 14, -12, 0],
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute top-1/2 -right-8 w-36 h-36 rounded-full bg-rose-200/25 blur-2xl pointer-events-none"
          animate={shouldReduceMotion ? {} : {
            x: [0, -10, 8, 0],
            y: [0, 10, -10, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        <motion.div
          className="relative z-10 max-w-2xl"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 border border-blush-200 text-blush-700 text-xs sm:text-sm font-medium mb-4 shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-gold-500" />
            <span>Smart Personalized Gifting</span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold text-stone-900 tracking-tight leading-[1.15]"
          >
            Fouzas Creation
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mt-3 text-lg sm:text-2xl text-stone-600 font-serif italic"
          >
            Made for your special moments
          </motion.p>

          <motion.p
            variants={itemVariants}
            className="mt-4 text-stone-600 text-sm sm:text-base leading-relaxed max-w-xl"
          >
            Bespoke gift hampers, handcrafted bouquets, personalized memory frames, and artisanal creations crafted exclusively for the people you cherish most.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="mt-8 flex flex-col sm:flex-row items-center gap-3 sm:gap-4"
          >
            <Link
              to="/create"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blush-500 via-blush-600 to-rose-600 hover:from-blush-600 hover:to-rose-700 text-white font-semibold text-base shadow-elevated transition-all transform active:scale-95 flex items-center justify-center gap-2 tap-target"
            >
              <Gift className="w-5 h-5 text-gold-200" />
              <span>Create Your Gift</span>
            </Link>

            <Link
              to="/explore"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white/90 hover:bg-white text-stone-700 font-medium text-base border border-stone-200 shadow-soft transition-all active:scale-95 flex items-center justify-center gap-2 tap-target"
            >
              <span>Explore Catalog</span>
              <ChevronRight className="w-4 h-4 text-stone-400" />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* 2. Featured Gifts Grid */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-gold-600 font-semibold mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Handpicked Creations</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
              Featured Gifts
            </h2>
          </div>

          <Link
            to="/explore"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-blush-600 hover:text-blush-700 transition-colors group"
          >
            <span>View All Gifts</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loadingFeatured ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <GiftCardSkeleton />
            <GiftCardSkeleton />
            <GiftCardSkeleton />
          </div>
        ) : featuredGifts.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-stone-200/80 text-center text-sm text-stone-500">
            Check out our{' '}
            <Link to="/explore" className="text-blush-600 font-semibold underline">
              full catalog
            </Link>{' '}
            for all handcrafted designs.
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-20px' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {featuredGifts.map((gift) => (
              <motion.div key={gift._id} variants={itemVariants}>
                <GiftCard gift={gift} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* 3. Shop by Category Tiles */}
      <section className="space-y-6">
        <div>
          <span className="text-xs uppercase tracking-widest text-gold-600 font-semibold block mb-1">
            Browse By Craft
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
            Shop by Category
          </h2>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-20px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {SHOP_CATEGORIES.map((item) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.category}
                variants={itemVariants}
                whileHover={shouldReduceMotion ? {} : { y: -4, transition: { duration: 0.2 } }}
              >
                <Link
                  to={`/explore?category=${item.category}`}
                  className={`group p-5 rounded-2xl bg-gradient-to-br ${item.gradient} border shadow-soft hover:shadow-elevated transition-all flex flex-col justify-between h-full`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="font-serif text-lg font-bold text-stone-900 group-hover:text-blush-600 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-stone-600 leading-relaxed">
                        {item.subtitle}
                      </p>
                    </div>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.accent} shadow-xs`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-200/50 flex items-center justify-between text-xs font-semibold text-stone-700 group-hover:text-blush-600 transition-colors">
                    <span>Explore category</span>
                    <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* 4. Occasion Categories (Existing) */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-xs uppercase tracking-widest text-gold-600 font-semibold">
              Curated Collections
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
              Celebrate Every Occasion
            </h2>
          </div>
          <p className="text-sm text-stone-500 max-w-sm">
            Select an occasion to customize your theme, colors, and personal touch.
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-20px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {OCCASIONS.map((occ) => {
            const Icon = occ.icon;
            return (
              <motion.div
                key={occ.id}
                variants={itemVariants}
                whileHover={shouldReduceMotion ? {} : { y: -4, transition: { duration: 0.2 } }}
                className="group"
              >
                <Link
                  to={`/create?occasion=${encodeURIComponent(occ.title)}`}
                  className={`block h-full p-5 rounded-2xl bg-gradient-to-b ${occ.gradient} border shadow-soft transition-shadow hover:shadow-elevated flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-11 h-11 rounded-xl bg-white/90 shadow-xs flex items-center justify-center ${occ.accent}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/70 text-stone-600 border border-stone-200/50">
                        {occ.tag}
                      </span>
                    </div>

                    <h3 className="font-serif text-lg font-bold text-stone-900 group-hover:text-blush-600 transition-colors">
                      {occ.title}
                    </h3>
                    <p className="mt-1.5 text-xs text-stone-600 leading-relaxed">
                      {occ.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-200/40 flex items-center justify-between text-xs font-semibold text-stone-700 group-hover:text-blush-600 transition-colors">
                    <span>Personalize now</span>
                    <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* 5. Trust & Quality Features (Existing) */}
      <section className="bg-white/80 border border-blush-100 rounded-3xl p-6 sm:p-8 shadow-soft">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blush-50 text-blush-600 flex items-center justify-center shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-stone-900 text-base">Handcrafted Quality</h4>
              <p className="mt-1 text-xs text-stone-500 leading-relaxed">
                Every hamper and frame is meticulously assembled with premium materials.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gold-50 text-gold-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-stone-900 text-base">Order Transparency</h4>
              <p className="mt-1 text-xs text-stone-500 leading-relaxed">
                Track status milestones from received to delivered in your account dashboard.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-cream-200 text-stone-700 flex items-center justify-center shrink-0">
              <Smile className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-stone-900 text-base">Personalized Previews</h4>
              <p className="mt-1 text-xs text-stone-500 leading-relaxed">
                Coordinate custom fonts, themes, and personalized messages before finalizing.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
