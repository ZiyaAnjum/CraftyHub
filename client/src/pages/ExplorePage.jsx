import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Gift, Heart, ArrowRight } from 'lucide-react';

const CREATIONS = [
  {
    id: 1,
    title: 'Luxury Velvet Anniversary Hamper',
    category: 'Anniversary',
    price: '₹3,500',
    description: 'Scented organic candle, customized acrylic photo plaque, premium chocolates, and fairy light packaging.',
    badge: 'Bestseller',
  },
  {
    id: 2,
    title: 'Custom Wooden Photo Clock Frame',
    category: 'Birthday',
    price: '₹1,850',
    description: 'Laser-cut birch wood clock with personalized portrait engravings and celebratory quotes.',
    badge: 'Personalized',
  },
  {
    id: 3,
    title: 'Grand Royal Engagement Platter',
    category: 'Engagement',
    price: '₹4,800',
    description: 'Double ring box, brass accents, dried floral wreath, and bespoke calligraphy name scrolls.',
    badge: 'Handcrafted',
  },
  {
    id: 4,
    title: 'Floral Trousseau Welcome Hamper',
    category: 'Wedding',
    price: '₹5,500',
    description: 'Bespoke silk ribbon hamper, premium nuts jar, gold-embossed greeting card, and scented wax sachets.',
    badge: 'Premium',
  },
  {
    id: 5,
    title: 'Neon Acrylic Birthday Memory Light',
    category: 'Birthday',
    price: '₹2,200',
    description: 'Warm glowing LED custom name plaque with wooden base and USB power cord.',
    badge: 'Popular',
  },
  {
    id: 6,
    title: 'Silver Jubilee Forever Box',
    category: 'Anniversary',
    price: '₹3,900',
    description: 'Velvet jewelry box with personalized engraving, dried lavender accents, and champagne flutes.',
    badge: 'Special Edition',
  },
];

const CATEGORIES = ['All', 'Birthday', 'Engagement', 'Wedding', 'Anniversary'];

export function ExplorePage() {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filtered = selectedCategory === 'All'
    ? CREATIONS
    : CREATIONS.filter((item) => item.category === selectedCategory);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold-600 uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Curated Inspirations</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-4xl font-bold text-stone-900 mt-1">
          Explore Our Bespoke Creations
        </h1>
        <p className="text-sm text-stone-500 mt-1 max-w-xl">
          Browse handcrafted gifts, customized frames, and celebration hampers made with love by Fouzas Creation.
        </p>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all tap-target ${
              selectedCategory === cat
                ? 'bg-blush-600 text-white shadow-soft ring-2 ring-blush-200'
                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200/80'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid of Creations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-soft hover:shadow-elevated transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-blush-600 uppercase tracking-wider">
                  {item.category}
                </span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-cream-100 text-stone-700 border border-gold-200/60">
                  {item.badge}
                </span>
              </div>

              <h3 className="font-serif text-lg font-bold text-stone-900 group-hover:text-blush-600 transition-colors">
                {item.title}
              </h3>
              <p className="mt-2 text-xs text-stone-500 leading-relaxed">
                {item.description}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-stone-400 block">Starting from</span>
                <span className="font-bold text-stone-900 text-base">{item.price}</span>
              </div>

              <Link
                to={`/create?occasion=${encodeURIComponent(item.category)}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blush-50 hover:bg-blush-100 text-blush-700 text-xs font-semibold transition-colors tap-target"
              >
                <span>Customize</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
