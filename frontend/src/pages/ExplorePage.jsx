import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Search,
  X,
  Gift,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  SlidersHorizontal,
  ArrowRight,
  Filter,
  Check
} from 'lucide-react';
import { api } from '../lib/api';
import { ItemCard } from '../components/ItemCard';
import { ItemCardSkeleton } from '../components/Skeleton';
import { getShopWhatsAppUrl } from '../lib/whatsapp';

const CATEGORIES = ['All', 'Bouquet', 'Hamper', 'Frame', 'Engraved', 'Other'];

const OCCASIONS = [
  'All',
  'Birthday',
  'Anniversary',
  'Wedding',
  'Engagement',
  'Baby Shower',
  'Housewarming',
  'Corporate',
  'Festive',
];

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured First' },
  { value: 'newest', label: 'Newest Arrivals' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

export const BUDGET_RANGES = [
  { id: 'all', label: 'All Budgets', min: null, max: null },
  { id: 'under-500', label: 'Under ₹500', min: 0, max: 500 },
  { id: '500-1500', label: '₹500 – ₹1,500', min: 500, max: 1500 },
  { id: '1500-3000', label: '₹1,500 – ₹3,000', min: 1500, max: 3000 },
  { id: 'above-3000', label: 'Above ₹3,000', min: 3000, max: null },
];

export function ExplorePage() {
  const shouldReduceMotion = useReducedMotion();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read state from URL query params
  const categoryParam = searchParams.get('category');
  const initialCategory = CATEGORIES.includes(categoryParam) ? categoryParam : 'All';
  const occasionParam = searchParams.get('occasion');
  const initialOccasion = OCCASIONS.includes(occasionParam) ? occasionParam : 'All';
  const budgetParam = searchParams.get('budget');
  const initialBudget = BUDGET_RANGES.some((b) => b.id === budgetParam) ? budgetParam : 'all';
  const sortParam = searchParams.get('sort');
  const initialSort = SORT_OPTIONS.some((s) => s.value === sortParam) ? sortParam : 'featured';
  const initialQuery = searchParams.get('q') || '';
  const initialPage = parseInt(searchParams.get('page') || '1', 10);

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedOccasion, setSelectedOccasion] = useState(initialOccasion);
  const [selectedBudget, setSelectedBudget] = useState(initialBudget);
  const [sortBy, setSortBy] = useState(initialSort);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [page, setPage] = useState(isNaN(initialPage) ? 1 : initialPage);

  const [items, setItems] = useState([]);
  const [featuredItems, setFeaturedItems] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 12, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync debounced search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Sync state to URL searchParams
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory && selectedCategory !== 'All') {
      params.set('category', selectedCategory);
    }
    if (selectedOccasion && selectedOccasion !== 'All') {
      params.set('occasion', selectedOccasion);
    }
    if (selectedBudget && selectedBudget !== 'all') {
      params.set('budget', selectedBudget);
    }
    if (sortBy && sortBy !== 'featured') {
      params.set('sort', sortBy);
    }
    if (debouncedQuery.trim()) {
      params.set('q', debouncedQuery.trim());
    }
    if (page > 1) {
      params.set('page', String(page));
    }
    setSearchParams(params, { replace: true });
  }, [selectedCategory, selectedOccasion, selectedBudget, sortBy, debouncedQuery, page, setSearchParams]);

  // Check if any filter is active
  const hasActiveFilters = useMemo(() => {
    return (
      (selectedCategory && selectedCategory !== 'All') ||
      (selectedOccasion && selectedOccasion !== 'All') ||
      (selectedBudget && selectedBudget !== 'all') ||
      Boolean(debouncedQuery.trim()) ||
      sortBy !== 'featured'
    );
  }, [selectedCategory, selectedOccasion, selectedBudget, debouncedQuery, sortBy]);

  // Fetch Featured items for top row (only needed if no active filters)
  useEffect(() => {
    let isMounted = true;
    async function loadFeatured() {
      try {
        const res = await api.get('/api/items/featured');
        if (isMounted) {
          setFeaturedItems(res.items || []);
        }
      } catch {
        // Non-blocking
      } finally {
        if (isMounted) setLoadingFeatured(false);
      }
    }
    loadFeatured();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch items based on active filters & pagination
  const fetchItems = async () => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (selectedCategory && selectedCategory !== 'All') {
        queryParams.set('category', selectedCategory);
      }
      if (selectedOccasion && selectedOccasion !== 'All') {
        queryParams.set('occasion', selectedOccasion);
      }
      if (selectedBudget && selectedBudget !== 'all') {
        const activeBudget = BUDGET_RANGES.find((b) => b.id === selectedBudget);
        if (activeBudget) {
          if (activeBudget.min !== null) queryParams.set('minPrice', String(activeBudget.min));
          if (activeBudget.max !== null) queryParams.set('maxPrice', String(activeBudget.max));
        }
      }
      if (sortBy) {
        queryParams.set('sort', sortBy);
      }
      if (debouncedQuery.trim()) {
        queryParams.set('q', debouncedQuery.trim());
      }
      queryParams.set('page', String(page));
      queryParams.set('limit', '12');

      const res = await api.get(`/api/items?${queryParams.toString()}`);
      setItems(res.items || []);
      if (res.pagination) {
        setPagination({
          total: res.pagination.total || 0,
          page: res.pagination.page || 1,
          limit: res.pagination.limit || 12,
          totalPages: res.pagination.totalPages || 1,
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to load creations. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [selectedCategory, selectedOccasion, selectedBudget, sortBy, debouncedQuery, page]);

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
    setPage(1);
  };

  const handleOccasionSelect = (occ) => {
    setSelectedOccasion(occ);
    setPage(1);
  };

  const handleBudgetSelect = (bId) => {
    setSelectedBudget(bId);
    setPage(1);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSelectedCategory('All');
    setSelectedOccasion('All');
    setSelectedBudget('all');
    setSortBy('featured');
    setSearchQuery('');
    setDebouncedQuery('');
    setPage(1);
  };

  const whatsappGeneralUrl = getShopWhatsAppUrl(
    'Hello Fouzas Creation! I visited your online catalog and would love to enquire about a custom gifting order.'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 sm:space-y-12">
      {/* 1. Full-Width Compact Intro Header */}
      <div className="bg-gradient-to-br from-cream-100/90 via-blush-50/70 to-cream-50 rounded-3xl p-6 sm:p-8 lg:p-10 border border-blush-100 shadow-soft">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Column: Title & Subtitle */}
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 text-rose-700 text-xs font-semibold tracking-wide uppercase shadow-xs border border-blush-200">
              <Sparkles className="w-3.5 h-3.5 text-gold-500" />
              <span>Boutique Gifting Studio</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-bold text-stone-900 leading-tight">
              Explore Our Handcrafted Creations
            </h1>
            <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
              Bespoke floral hampers, customized acrylic frames, elegant bouquets, and personalized treasures crafted with artistry in Bengaluru.
            </p>
          </div>

          {/* Right Column: Custom Order CTA Card */}
          <div className="lg:w-80 shrink-0 bg-white/95 backdrop-blur-md rounded-2xl p-5 border border-blush-200 shadow-soft flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Custom Orders Open
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-xs text-stone-700 leading-relaxed">
              Have a unique concept in mind? Tell us what you want made and we'll bring it to life.
            </p>
            <Link
              to="/create"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-blush-600 hover:from-rose-700 hover:to-blush-700 text-white text-xs sm:text-sm font-semibold tracking-wide shadow-rose-glow transition-all tap-target"
            >
              <span>Design Your Own</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Search, Filter Chips & Sort Controls */}
      <div className="space-y-4">
        {/* Row A: Search bar + Occasion Dropdown + Sort Control */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Debounced Search Bar */}
          <div className="relative flex-1 max-w-lg">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, category, or occasion..."
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

          {/* Right Controls: Occasion & Sort */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 sm:pb-0">
            {/* Occasion Filter Dropdown */}
            <div className="relative shrink-0">
              <label htmlFor="explore-occasion-select" className="sr-only">
                Filter by Occasion
              </label>
              <select
                id="explore-occasion-select"
                value={selectedOccasion}
                onChange={(e) => handleOccasionSelect(e.target.value)}
                className="appearance-none pl-3.5 pr-8 py-2 rounded-xl bg-white border border-stone-200 text-xs sm:text-sm font-semibold text-stone-700 hover:border-stone-300 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200 shadow-xs transition-all cursor-pointer"
              >
                {OCCASIONS.map((occ) => (
                  <option key={occ} value={occ}>
                    {occ === 'All' ? 'All Occasions' : occ}
                  </option>
                ))}
              </select>
              <Filter className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Sort Control Dropdown */}
            <div className="relative shrink-0">
              <label htmlFor="explore-sort-select" className="sr-only">
                Sort Items
              </label>
              <select
                id="explore-sort-select"
                value={sortBy}
                onChange={handleSortChange}
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

        {/* Row B: Category Chips (Horizontally Scrollable on Mobile) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          {CATEGORIES.map((cat) => {
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
                    layoutId={shouldReduceMotion ? undefined : 'activeCategoryChip'}
                    className="absolute inset-0 bg-rose-600 rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{cat === 'All' ? 'All Categories' : cat}</span>
              </button>
            );
          })}
        </div>

        {/* Row C: Budget Range Chips (F-03) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider shrink-0 mr-1 select-none">
            Budget:
          </span>
          {BUDGET_RANGES.map((b) => {
            const isSelected = selectedBudget === b.id;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => handleBudgetSelect(b.id)}
                className={`relative px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all tap-target ${
                  isSelected
                    ? 'text-stone-900 bg-gold-400 font-bold shadow-xs'
                    : 'bg-white text-stone-600 hover:bg-stone-50 border border-stone-200'
                }`}
              >
                {b.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Featured Row at the Top (shown only when no active filters are selected and featured items exist) */}
      {!hasActiveFilters && featuredItems.length > 0 && page === 1 && (
        <section className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-gold-100 text-gold-700">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <h2 className="font-serif text-lg sm:text-xl font-bold text-stone-900">
                  Featured Creations
                </h2>
                <span className="text-xs text-stone-500">
                  Customer favorites and signature studio pieces
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {featuredItems.slice(0, 4).map((item) => (
              <ItemCard key={`feat-${item._id || item.id}`} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* 4. Active Catalog Header / Result Counter */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-3">
        <h2 className="font-serif text-lg sm:text-xl font-bold text-stone-900 flex items-center gap-2">
          <span>{selectedCategory === 'All' ? 'All Creations' : selectedCategory}</span>
          {selectedOccasion !== 'All' && (
            <span className="text-xs font-normal text-stone-500">
              for {selectedOccasion}
            </span>
          )}
        </h2>

        {!loading && (
          <span className="text-xs text-stone-500 font-medium">
            {pagination.total} {pagination.total === 1 ? 'creation' : 'creations'} found
          </span>
        )}
      </div>

      {/* 5. Error State */}
      {error && (
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <span>{error}</span>
          <button
            type="button"
            onClick={fetchItems}
            className="px-4 py-2 rounded-xl bg-rose-600 text-white font-semibold text-xs hover:bg-rose-700 transition-colors shrink-0"
          >
            Retry Loading
          </button>
        </div>
      )}

      {/* 6. Main Items Grid & States */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          <ItemCardSkeleton />
          <ItemCardSkeleton />
          <ItemCardSkeleton />
          <ItemCardSkeleton />
          <ItemCardSkeleton />
          <ItemCardSkeleton />
          <ItemCardSkeleton />
          <ItemCardSkeleton />
        </div>
      ) : items.length === 0 ? (
        hasActiveFilters ? (
          /* Empty State when filters don't match */
          <div className="bg-white rounded-3xl p-10 sm:p-16 text-center border border-blush-100 shadow-soft space-y-4 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-cream-100 text-stone-400 flex items-center justify-center mx-auto">
              <Search className="w-8 h-8 text-stone-400" />
            </div>
            <h3 className="font-serif text-xl font-bold text-stone-900">
              No creations match your search
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
              We couldn't find any creations matching your current filters. Try clearing your filters or searching for different keywords.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs sm:text-sm font-semibold transition-colors shadow-xs"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Clear all filters</span>
              </button>
            </div>
          </div>
        ) : (
          /* Friendly state when store has no items at all */
          <div className="bg-white rounded-3xl p-10 sm:p-16 text-center border border-blush-100 shadow-soft space-y-4 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Gift className="w-8 h-8 text-rose-600" />
            </div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
              New creations coming soon!
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
              We are currently handcrafting our upcoming seasonal collection. In the meantime, you can place a custom bespoke order directly with us!
            </p>
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/create"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold transition-colors shadow-rose-glow"
              >
                Request Custom Creation
              </Link>
              <a
                href={whatsappGeneralUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs sm:text-sm font-semibold transition-colors"
              >
                Chat on WhatsApp
              </a>
            </div>
          </div>
        )
      ) : (
        /* Populated Grid with Framer Motion */
        <>
          <motion.div
            layout={shouldReduceMotion ? false : true}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6"
          >
            {items.map((item) => (
              <motion.div
                key={item._id || item.id}
                layout={shouldReduceMotion ? false : true}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <ItemCard item={item} />
              </motion.div>
            ))}
          </motion.div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-stone-200">
              <span className="text-xs sm:text-sm text-stone-500 font-medium">
                Showing page <span className="font-bold text-stone-900">{page}</span> of{' '}
                <span className="font-bold text-stone-900">{pagination.totalPages}</span> ({pagination.total} creations)
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3.5 py-2 rounded-xl border border-stone-200 bg-white text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 shadow-xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                {/* Page number indicators */}
                <div className="hidden sm:flex items-center gap-1">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - page) <= 1)
                    .map((p, idx, arr) => (
                      <React.Fragment key={p}>
                        {idx > 0 && p - arr[idx - 1] > 1 && (
                          <span className="px-1 text-stone-400 text-xs">...</span>
                        )}
                        <button
                          type="button"
                          onClick={() => setPage(p)}
                          className={`w-8 h-8 rounded-xl text-xs font-semibold transition-all ${
                            p === page
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    ))}
                </div>

                <button
                  type="button"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  className="px-3.5 py-2 rounded-xl border border-stone-200 bg-white text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 shadow-xs"
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
