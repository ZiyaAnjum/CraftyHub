import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles, Search, X, Gift, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { api } from '../lib/api';
import { GiftCard } from '../components/GiftCard';
import { GiftCardSkeleton } from '../components/Skeleton';

const CATEGORIES = ['All', 'Bouquet', 'Hamper', 'Frame', 'Engraved', 'Other'];

export function ExplorePage() {
  const shouldReduceMotion = useReducedMotion();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read initial values from URL query params
  const categoryParam = searchParams.get('category');
  const initialCategory = CATEGORIES.includes(categoryParam) ? categoryParam : 'All';
  const initialQuery = searchParams.get('q') || '';
  const initialPage = parseInt(searchParams.get('page') || '1', 10);

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [page, setPage] = useState(isNaN(initialPage) ? 1 : initialPage);

  const [gifts, setGifts] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 12, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync debounced search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Sync state to URL searchParams
  useEffect(() => {
    const params = {};
    if (selectedCategory && selectedCategory !== 'All') {
      params.category = selectedCategory;
    }
    if (debouncedQuery.trim()) {
      params.q = debouncedQuery.trim();
    }
    if (page > 1) {
      params.page = String(page);
    }
    setSearchParams(params, { replace: true });
  }, [selectedCategory, debouncedQuery, page, setSearchParams]);

  // Fetch gifts whenever category, debounced query, or page changes
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    async function fetchGifts() {
      try {
        const queryParams = new URLSearchParams();
        if (selectedCategory && selectedCategory !== 'All') {
          queryParams.set('category', selectedCategory);
        }
        if (debouncedQuery.trim()) {
          queryParams.set('q', debouncedQuery.trim());
        }
        queryParams.set('page', String(page));
        queryParams.set('limit', '12');

        const res = await api.get(`/api/items?${queryParams.toString()}`);
        if (isMounted) {
          setGifts(res.items || res.gifts || []);
          if (res.pagination) {
            setPagination(res.pagination);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load catalog gifts.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchGifts();

    return () => {
      isMounted = false;
    };
  }, [selectedCategory, debouncedQuery, page]);

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSelectedCategory('All');
    setSearchQuery('');
    setDebouncedQuery('');
    setPage(1);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold-600 uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Curated Inspirations</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-4xl font-bold text-stone-900 mt-1">
          Explore Our Bespoke Creations
        </h1>
        <p className="text-sm text-stone-500 mt-1 max-w-xl">
          Browse handcrafted gifts, customized frames, luxury bouquets, and celebration hampers made with love by Fouzas Creation.
        </p>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="space-y-4">
        {/* Search Input Box */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, occasion, or description..."
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white border border-stone-200/90 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-blush-500 focus:ring-1 focus:ring-blush-300 shadow-soft transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategorySelect(cat)}
                className={`relative px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors tap-target ${
                  isSelected
                    ? 'text-white'
                    : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200/80'
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId={shouldReduceMotion ? undefined : 'activeCategoryPill'}
                    className="absolute inset-0 bg-blush-600 rounded-xl shadow-soft ring-2 ring-blush-200"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{cat === 'All' ? 'All Gifts' : cat}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => handleCategorySelect(selectedCategory)}
            className="font-bold underline ml-3"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <GiftCardSkeleton />
          <GiftCardSkeleton />
          <GiftCardSkeleton />
          <GiftCardSkeleton />
          <GiftCardSkeleton />
          <GiftCardSkeleton />
        </div>
      ) : gifts.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl p-12 sm:p-16 text-center border border-stone-200/80 shadow-soft space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-cream-100 text-stone-400 flex items-center justify-center mx-auto">
            <Gift className="w-8 h-8 text-stone-400" />
          </div>
          <h3 className="font-serif text-xl font-bold text-stone-900">
            No Gifts Found
          </h3>
          <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
            We couldn't find any creations matching your search criteria
            {selectedCategory !== 'All' ? ` in "${selectedCategory}"` : ''}
            {debouncedQuery ? ` for "${debouncedQuery}"` : ''}.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blush-50 hover:bg-blush-100 text-blush-700 text-xs sm:text-sm font-semibold transition-colors shadow-xs"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset all filters</span>
            </button>
          </div>
        </div>
      ) : (
        /* Gift Grid */
        <>
          <motion.div
            layout={shouldReduceMotion ? false : true}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {gifts.map((gift) => (
              <motion.div
                key={gift._id}
                layout={shouldReduceMotion ? false : true}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                <GiftCard gift={gift} />
              </motion.div>
            ))}
          </motion.div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="pt-6 flex items-center justify-between border-t border-stone-200/80">
              <span className="text-xs text-stone-500 font-medium">
                Showing page <span className="font-bold text-stone-800">{page}</span> of{' '}
                <span className="font-bold text-stone-800">{pagination.pages}</span> (
                {pagination.total} gifts)
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  disabled={page >= pagination.pages}
                  onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                  className="px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
