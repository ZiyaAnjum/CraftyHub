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
import { ItemCard } from '../components/ItemCard';
import { ItemCardSkeleton } from '../components/Skeleton';
import { Hero } from '../components/home/Hero';
import { stagger, fadeUp } from '../lib/motion';

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
  const [featuredItems, setFeaturedItems] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadFeatured() {
      try {
        const res = await api.get('/api/items/featured');
        if (isMounted) {
          setFeaturedItems(res.items || []);
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
    <div className="space-y-14 sm:space-y-20">
      {/* 1. Immersive Hero Section */}
      <Hero />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-14 sm:space-y-20">
        {/* 2. Featured Creations Grid (shows nothing when there are no featured items) */}
        {(loadingFeatured || featuredItems.length > 0) && (
          <section id="home-featured-section" className="space-y-6 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-gold-600 font-semibold mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Handpicked Creations</span>
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
                  Featured Creations
                </h2>
              </div>

              <Link
                to="/explore"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-rose-600 hover:text-rose-700 transition-colors group"
              >
                <span>View Full Catalog</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {loadingFeatured ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <ItemCardSkeleton />
                <ItemCardSkeleton />
                <ItemCardSkeleton />
              </div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-20px' }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {featuredItems.map((item) => (
                  <motion.div key={item._id || item.id} variants={itemVariants}>
                    <ItemCard item={item} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </section>
        )}

        {/* 3. Gift Builder Wizard Showcase Banner (PRD F-30 to F-33) */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-stone-900 via-rose-950 to-stone-900 text-white p-6 sm:p-10 shadow-elevated border border-gold-500/30">
          <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-72 h-72 rounded-full bg-gold-400/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-400/20 text-gold-300 text-xs font-bold uppercase tracking-wider border border-gold-400/30 backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-gold-300" />
              <span>Smart Gift Builder</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-white leading-tight">
              Looking for something tailored? <br />
              <span className="italic text-gold-300">Let our wizard guide your gift.</span>
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed max-w-xl">
              Answer 4 quick questions about the occasion, recipient, and budget. Our rule-engine curates top handcrafted creations matched with personalized styling.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                to="/gift-builder"
                className="px-6 py-3.5 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-500 hover:to-gold-600 text-stone-950 font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 tap-target"
              >
                <Gift className="w-4 h-4 text-stone-950" />
                <span>Launch Gift Builder</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/explore"
                className="px-5 py-3.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs sm:text-sm font-semibold border border-white/20 transition-colors tap-target"
              >
                <span>Browse All Products</span>
              </Link>
            </div>
          </div>
        </section>

        {/* 3B. Build-Your-Own Hamper Studio Banner (PRD F-40 to F-42) */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cream-100 via-rose-50/60 to-amber-50/70 border border-gold-300/60 p-6 sm:p-10 shadow-soft">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blush-100 text-blush-800 text-xs font-bold uppercase tracking-wider border border-blush-200">
                <Package className="w-3.5 h-3.5 text-blush-600" />
                <span>Custom Curation Studio</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 leading-tight">
                Build Your Own <span className="text-blush-700 italic">Bespoke Hamper</span>
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Pick an artisanal base—from velvet trunks to handwoven willow baskets. Add your favorite chocolates, keepsakes, and bouquets with live price updates and an engraved gift card.
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Link
                  to="/hamper-builder"
                  className="px-6 py-3.5 rounded-full bg-gradient-to-r from-blush-500 to-rose-600 hover:from-blush-600 hover:to-rose-700 text-white font-bold text-xs sm:text-sm shadow-soft transition-all flex items-center gap-2 tap-target"
                >
                  <Package className="w-4 h-4 text-white" />
                  <span>Start Building Hamper</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <span className="text-xs text-stone-500 font-medium">
                  Starting from ₹299 base + curated items
                </span>
              </div>
            </div>

            {/* Visual Feature Badges */}
            <div className="grid grid-cols-2 gap-3 shrink-0 w-full sm:w-auto">
              <div className="p-3.5 rounded-2xl bg-white border border-stone-200/80 shadow-2xs text-center space-y-1">
                <span className="text-2xl">🧺</span>
                <p className="font-serif font-bold text-xs text-stone-900">Wicker Baskets</p>
                <p className="text-[10px] text-stone-500">Eco willow & satin</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-white border border-stone-200/80 shadow-2xs text-center space-y-1">
                <span className="text-2xl">📦</span>
                <p className="font-serif font-bold text-xs text-stone-900">Velvet Trunks</p>
                <p className="text-[10px] text-stone-500">Brass keepsake clasp</p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Shop by Category Tiles */}
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
    </div>
  );
}
