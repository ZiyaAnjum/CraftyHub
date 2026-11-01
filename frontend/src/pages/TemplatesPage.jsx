import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Sparkles,
  Search,
  X,
  SlidersHorizontal,
  RotateCcw,
  Film,
  MessageCircle,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { api } from '../lib/api';
import { TemplateCard } from '../components/TemplateCard';
import { TemplateCardSkeleton } from '../components/Skeleton';
import { getShopWhatsAppUrl } from '../lib/whatsapp';

export const TEMPLATE_CATEGORIES = [
  'All',
  'Wedding',
  'Engagement',
  'Birthday',
  'Nikah / Mehendi',
  'Baby Shower',
  'Other',
];

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured First' },
  { value: 'newest', label: 'Newest Arrivals' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

export function TemplatesPage() {
  const shouldReduceMotion = useReducedMotion();
  const [searchParams, setSearchParams] = useSearchParams();

  const categoryParam = searchParams.get('category');
  const initialCategory = TEMPLATE_CATEGORIES.includes(categoryParam) ? categoryParam : 'All';
  const sortParam = searchParams.get('sort');
  const initialSort = SORT_OPTIONS.some((s) => s.value === sortParam) ? sortParam : 'featured';
  const initialQuery = searchParams.get('q') || '';

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState(initialSort);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync debounced search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Sync state to URL searchParams
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory && selectedCategory !== 'All') {
      params.set('category', selectedCategory);
    }
    if (sortBy && sortBy !== 'featured') {
      params.set('sort', sortBy);
    }
    if (debouncedQuery.trim()) {
      params.set('q', debouncedQuery.trim());
    }
    setSearchParams(params, { replace: true });
  }, [selectedCategory, sortBy, debouncedQuery, setSearchParams]);

  // Set document title & SEO
  useEffect(() => {
    document.title = 'Video Invitation Templates | Fouzas Creation';
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.content =
      'Browse handcrafted animated video invitations for weddings, birthdays, Islamic celebrations, and baby milestones. Customized names, dates, and audio included.';

    return () => {
      document.title = 'Fouzas Creation | Made for your special moments';
    };
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      (selectedCategory && selectedCategory !== 'All') ||
      Boolean(debouncedQuery.trim()) ||
      sortBy !== 'featured'
    );
  }, [selectedCategory, debouncedQuery, sortBy]);

  // Fetch templates from API
  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (selectedCategory && selectedCategory !== 'All') {
        queryParams.set('category', selectedCategory);
      }
      if (sortBy) {
        queryParams.set('sort', sortBy);
      }
      if (debouncedQuery.trim()) {
        queryParams.set('q', debouncedQuery.trim());
      }

      const queryString = queryParams.toString();
      const endpoint = queryString ? `/api/templates?${queryString}` : '/api/templates';
      const data = await api.get(endpoint);
      setTemplates(data.templates || []);
    } catch (err) {
      setError(err.message || 'Unable to load video templates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [selectedCategory, sortBy, debouncedQuery]);

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
  };

  const handleResetFilters = () => {
    setSelectedCategory('All');
    setSortBy('featured');
    setSearchQuery('');
    setDebouncedQuery('');
  };

  const whatsappInquiryUrl = getShopWhatsAppUrl(
    'Hello Fouzas Creation, I am interested in a custom video invitation template.'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 sm:space-y-10">
      {/* 1. Hero Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-br from-cream-100 via-blush-50 to-cream-200 border border-blush-200/80 p-6 sm:p-10 shadow-soft overflow-hidden">
        {/* Subtle decorative glow circles */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-gold-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-blush-200/40 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-blush-200 text-rose-700 text-xs font-semibold shadow-xs">
              <Film className="w-3.5 h-3.5 text-rose-600" />
              <span>Animated Video Invitations & Announcements</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-bold text-stone-900 leading-tight">
              Ready-Made Video Templates
            </h1>
            <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
              Choose an aesthetic template for your wedding, engagement, birthday, or nikah. We'll personalize it with your custom names, dates, venue, and audio with fast turnaround.
            </p>
          </div>

          {/* Right Column: Custom Video Inquiry Card */}
          <div className="lg:w-80 shrink-0 bg-white/95 backdrop-blur-md rounded-2xl p-5 border border-blush-200 shadow-soft flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Custom Video Designs
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-xs text-stone-700 leading-relaxed">
              Need a completely custom concept from scratch? Chat with our creator directly on WhatsApp.
            </p>
            <a
              href={whatsappInquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-semibold tracking-wide shadow-md transition-all tap-target"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Inquire on WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. Search, Filter Chips & Sort Controls */}
      <div className="space-y-4">
        {/* Row A: Search Bar + Sort Control */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Debounced Search Bar */}
          <div className="relative flex-1 max-w-lg">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates by title, theme, or category..."
              className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white border border-stone-200 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200 shadow-xs transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                aria-label="Clear search input"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right Controls: Sort & Reset */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 sm:pb-0">
            {/* Sort Control Dropdown */}
            <div className="relative shrink-0">
              <label htmlFor="template-sort-select" className="sr-only">
                Sort Templates
              </label>
              <select
                id="template-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none pl-3.5 pr-8 py-2 rounded-xl bg-white border border-stone-200 text-xs sm:text-sm font-semibold text-stone-700 hover:border-stone-300 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200 shadow-xs transition-all cursor-pointer"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <SlidersHorizontal className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Clear Filters Button (shown only when filters active) */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors shrink-0 tap-target"
                title="Reset all filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Row B: Category Filter Chips (Horizontally Scrollable) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          {TEMPLATE_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategorySelect(cat)}
                className={`relative px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all tap-target ${
                  isSelected
                    ? 'text-white bg-rose-600 shadow-sm shadow-rose-200'
                    : 'bg-white text-stone-700 hover:bg-cream-100/70 border border-stone-200/90'
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId={shouldReduceMotion ? undefined : 'activeTemplateCategoryChip'}
                    className="absolute inset-0 bg-rose-600 rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{cat === 'All' ? 'All Templates' : cat}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Main Templates Grid Area */}
      <div>
        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, idx) => (
              <TemplateCardSkeleton key={idx} />
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="py-16 text-center space-y-4 max-w-md mx-auto">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h3 className="font-serif text-xl font-bold text-stone-900">
              Unable to load templates
            </h3>
            <p className="text-sm text-stone-600">{error}</p>
            <button
              type="button"
              onClick={fetchTemplates}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && templates.length === 0 && (
          <div className="py-16 text-center space-y-4 max-w-md mx-auto bg-white rounded-3xl border border-blush-100 p-8 shadow-soft">
            <div className="w-16 h-16 rounded-full bg-cream-100 text-stone-400 flex items-center justify-center mx-auto">
              <Film className="w-8 h-8 text-rose-400" />
            </div>
            <h3 className="font-serif text-xl font-bold text-stone-900">
              No matching video templates
            </h3>
            <p className="text-sm text-stone-600">
              {hasActiveFilters
                ? 'Try adjusting your search query or switching categories to find available video templates.'
                : 'No video templates are currently published. Check back soon or request a custom order!'}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blush-50 hover:bg-blush-100 text-rose-700 text-xs font-semibold transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Filters</span>
              </button>
            )}
          </div>
        )}

        {/* Populated Grid */}
        {!loading && !error && templates.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between text-xs sm:text-sm text-stone-500 font-medium">
              <span>
                Showing {templates.length} {templates.length === 1 ? 'template' : 'templates'}
              </span>
              <span className="text-stone-400">
                Hover card to preview video
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {templates.map((tpl) => (
                <TemplateCard key={tpl._id || tpl.id} template={tpl} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
