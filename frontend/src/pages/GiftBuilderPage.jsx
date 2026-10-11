import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Sparkles,
  Gift,
  Heart,
  Cake,
  Calendar,
  Briefcase,
  Users,
  Smile,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  Sliders,
  AlertCircle,
  Tag,
  Palette,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { useDraft } from '../hooks/useDraft';
import { getOptimizedImageUrl } from '../lib/images';

const OCCASIONS = [
  { id: 'birthday', label: 'Birthday', icon: Cake, desc: 'Joyous cakes, hampers & age plaques' },
  { id: 'anniversary', label: 'Anniversary', icon: Calendar, desc: 'Romantic frames, platters & keepsakes' },
  { id: 'wedding', label: 'Wedding', icon: Heart, desc: 'Grand hampers, bouquets & trousseau' },
  { id: 'engagement', label: 'Engagement', icon: Sparkles, desc: 'Ring platters & couple celebration gifts' },
  { id: 'corporate', label: 'Corporate / Farewell', icon: Briefcase, desc: 'Refined desk decor & executive hampers' },
  { id: 'valentine', label: "Valentine's / Romance", icon: Heart, desc: 'Everlasting bouquets & heartfelt tokens' },
  { id: 'festival', label: 'Festival / Celebration', icon: Sparkles, desc: 'Diwali, Eid, Christmas & housewarming' },
  { id: 'other', label: 'Other Special Moment', icon: Gift, desc: 'Custom milestone or just-because surprise' },
];

const RECIPIENTS = [
  { id: 'partner', label: 'Partner / Spouse', icon: Heart, desc: 'Husband, wife, girlfriend or boyfriend' },
  { id: 'friend', label: 'Best Friend', icon: Users, desc: 'Lifelong buddy or close friend' },
  { id: 'family', label: 'Parents / Family', icon: Smile, desc: 'Mom, dad, siblings or relatives' },
  { id: 'colleague', label: 'Colleague / Mentor', icon: Briefcase, desc: 'Teammate, manager or client' },
  { id: 'child', label: 'Child / Kid', icon: Smile, desc: 'Little ones, nephews or nieces' },
  { id: 'someone_special', label: 'Someone Special', icon: Sparkles, desc: 'A cherished person in your life' },
];

const BUDGET_OPTIONS = [
  { id: 'under_500', label: 'Under ₹500', sub: 'Thoughtful mini tokens & pocket gestures' },
  { id: '500_1500', label: '₹500 – ₹1,500', sub: 'Most popular for frames, platters & bouquets' },
  { id: '1500_3000', label: '₹1,500 – ₹3,000', sub: 'Premium curated hampers & luxury keepsakes' },
  { id: 'above_3000', label: 'Above ₹3,000', sub: 'Grand multi-item hampers & trousseau packing' },
  { id: 'any', label: 'Flexible / Any Budget', sub: 'Showcase best suggestions regardless of price' },
];

const STYLE_TAGS = [
  'Romantic',
  'Elegant & Royal',
  'Minimalist Clean',
  'Vintage Keepsake',
  'Playful & Cheerful',
  'Luxury Floral',
  'Traditional Classic',
  'Handwritten Lettering',
];

const COLOR_PALETTES = [
  { id: 'Rose & Blush', hex: '#C4486A' },
  { id: 'Regal Gold & Ivory', hex: '#D4AF37' },
  { id: 'Lavender & Lilac', hex: '#8B5CF6' },
  { id: 'Crimson Wine', hex: '#991B1B' },
  { id: 'Emerald & Sage', hex: '#059669' },
  { id: 'Warm Neutrals', hex: '#78716C' },
];

export function GiftBuilderPage() {
  const shouldReduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const { updateDraft } = useDraft();

  // Wizard state: 1: Occasion, 2: Recipient, 3: Budget, 4: Style/Color, 5: Results
  const [step, setStep] = useState(1);

  // Form selections
  const [occasion, setOccasion] = useState('anniversary');
  const [customOccasion, setCustomOccasion] = useState('');
  const [recipient, setRecipient] = useState('partner');
  const [budget, setBudget] = useState('500_1500');
  const [selectedStyles, setSelectedStyles] = useState(['Romantic', 'Elegant & Royal']);
  const [selectedColor, setSelectedColor] = useState('Rose & Blush');

  // Suggestion API state
  const [suggestions, setSuggestions] = useState([]);
  const [criteriaSummary, setCriteriaSummary] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestError, setSuggestError] = useState(null);

  // Fetch recommendations from rule-based endpoint
  const fetchSuggestions = async () => {
    setLoadingSuggestions(true);
    setSuggestError(null);

    const chosenOccasion = occasion === 'other' && customOccasion.trim() ? customOccasion.trim() : occasion;

    try {
      const res = await api.post('/api/builder/suggest', {
        occasion: chosenOccasion,
        recipient,
        budget,
        preferences: selectedStyles,
        color: selectedColor,
      });

      setSuggestions(res.suggestions || []);
      setCriteriaSummary(res.criteria || {});
      setStep(5);
    } catch (err) {
      if (err instanceof ApiError) {
        setSuggestError(err.message || 'Failed to fetch recommendations.');
      } else {
        setSuggestError('Network error while generating suggestions. Please try again.');
      }
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (step === 4) {
      fetchSuggestions();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const toggleStyle = (style) => {
    if (selectedStyles.includes(style)) {
      setSelectedStyles(selectedStyles.filter((s) => s !== style));
    } else {
      if (selectedStyles.length < 4) {
        setSelectedStyles([...selectedStyles, style]);
      }
    }
  };

  // CTA on each suggested item: opens /create prefilled, draft preserved
  const handleCustomizeItem = (item) => {
    const finalOccasion = occasion === 'other' && customOccasion.trim() ? customOccasion.trim() : occasion;
    const occLabel = OCCASIONS.find((o) => o.id === finalOccasion)?.label || finalOccasion;

    // Prefill draft
    updateDraft({
      selectedItemId: item._id || item.id,
      occasion: occLabel,
      requirements: `Gift for ${recipient}. Preferred style: ${selectedStyles.join(', ')}. Color theme: ${selectedColor}.`,
    });

    // Navigate to create flow with URL params
    navigate(`/create?item=${encodeURIComponent(item._id || item.id)}&occasion=${encodeURIComponent(occLabel)}`);
  };

  const effectiveOccasionLabel =
    occasion === 'other' && customOccasion.trim()
      ? customOccasion.trim()
      : OCCASIONS.find((o) => o.id === occasion)?.label || occasion;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 pb-28 md:pb-16">
      {/* Header & Subtitle */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blush-100/80 text-blush-800 text-xs font-bold uppercase tracking-wider shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-blush-600" />
          <span>Interactive Gift Wizard</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 leading-tight">
          Craft Your Ideal Gift
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 max-w-lg mx-auto leading-relaxed">
          Tell us about the occasion and person you love. Our studio rule-engine will curate bespoke creations crafted for your story.
        </p>
      </div>

      {/* Progress Bar (Step 1-4) */}
      {step <= 4 && (
        <div className="space-y-2 max-w-xl mx-auto">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-600">
            <span>Step {step} of 4</span>
            <span className="text-blush-700">
              {step === 1 && '1. Choose Occasion'}
              {step === 2 && '2. Choose Recipient'}
              {step === 3 && '3. Budget Range'}
              {step === 4 && '4. Style & Colors'}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-stone-200 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blush-500 to-rose-600"
              initial={false}
              animate={{ width: `${(step / 4) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}

      {/* STEP 1: OCCASION */}
      {step === 1 && (
        <motion.div
          key="step-1"
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-5 sm:p-8 border border-blush-100 shadow-soft space-y-6"
        >
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
              What is the celebration or occasion?
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Select the milestone so we can tailor themes, plaques, and festive arrangements.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {OCCASIONS.map((occ) => {
              const Icon = occ.icon;
              const isSelected = occasion === occ.id;
              return (
                <button
                  key={occ.id}
                  type="button"
                  onClick={() => setOccasion(occ.id)}
                  className={`p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all tap-target ${
                    isSelected
                      ? 'border-blush-600 bg-blush-50/70 shadow-sm ring-1 ring-blush-400'
                      : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50/60'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-blush-600 text-white shadow-2xs' : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-serif font-bold text-stone-900 text-sm block">
                      {occ.label}
                    </span>
                    <span className="text-xs text-stone-500 leading-snug block mt-0.5">
                      {occ.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {occasion === 'other' && (
            <div className="pt-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                Specify Your Occasion
              </label>
              <input
                type="text"
                maxLength={60}
                value={customOccasion}
                onChange={(e) => setCustomOccasion(e.target.value)}
                placeholder="e.g. Graduation, Housewarming, New Born Baby..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-cream-50/50 text-stone-900 text-sm focus:bg-white focus:border-blush-500 transition-colors"
              />
            </div>
          )}
        </motion.div>
      )}

      {/* STEP 2: RECIPIENT */}
      {step === 2 && (
        <motion.div
          key="step-2"
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-5 sm:p-8 border border-blush-100 shadow-soft space-y-6"
        >
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
              Who is this special creation for?
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Helps us recommend personalized aesthetics, hampers, or memorable frames.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {RECIPIENTS.map((rec) => {
              const Icon = rec.icon;
              const isSelected = recipient === rec.id;
              return (
                <button
                  key={rec.id}
                  type="button"
                  onClick={() => setRecipient(rec.id)}
                  className={`p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all tap-target ${
                    isSelected
                      ? 'border-blush-600 bg-blush-50/70 shadow-sm ring-1 ring-blush-400'
                      : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50/60'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-blush-600 text-white shadow-2xs' : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-serif font-bold text-stone-900 text-sm block">
                      {rec.label}
                    </span>
                    <span className="text-xs text-stone-500 leading-snug block mt-0.5">
                      {rec.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* STEP 3: BUDGET */}
      {step === 3 && (
        <motion.div
          key="step-3"
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-5 sm:p-8 border border-blush-100 shadow-soft space-y-6"
        >
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
              What is your intended budget range?
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              We curate options within your comfort zone. All quotes are confirmed before creation.
            </p>
          </div>

          <div className="space-y-3">
            {BUDGET_OPTIONS.map((b) => {
              const isSelected = budget === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBudget(b.id)}
                  className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between gap-4 transition-all tap-target ${
                    isSelected
                      ? 'border-gold-500 bg-gold-50/70 shadow-sm ring-1 ring-gold-400'
                      : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50/60'
                  }`}
                >
                  <div>
                    <span className="font-serif font-bold text-stone-900 text-base block">
                      {b.label}
                    </span>
                    <span className="text-xs text-stone-500 block mt-0.5">{b.sub}</span>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-gold-600 bg-gold-600 text-white' : 'border-stone-300'
                    }`}
                  >
                    {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* STEP 4: PREFERENCES & COLOR */}
      {step === 4 && (
        <motion.div
          key="step-4"
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-5 sm:p-8 border border-blush-100 shadow-soft space-y-6"
        >
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
              Aesthetic Style & Color Palette
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Select themes that resonate with your vision (choose up to 4).
            </p>
          </div>

          {/* Style Chips */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-700 block">
              Style Themes
            </span>
            <div className="flex flex-wrap gap-2">
              {STYLE_TAGS.map((style) => {
                const isSelected = selectedStyles.includes(style);
                return (
                  <button
                    key={style}
                    type="button"
                    onClick={() => toggleStyle(style)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all tap-target ${
                      isSelected
                        ? 'bg-blush-600 text-white shadow-2xs'
                        : 'bg-cream-100/80 text-stone-700 hover:bg-cream-200 border border-stone-200'
                    }`}
                  >
                    {style}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Palette */}
          <div className="space-y-2 pt-2 border-t border-stone-100">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-700 block">
              Preferred Color Palette
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {COLOR_PALETTES.map((c) => {
                const isSelected = selectedColor === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedColor(c.id)}
                    className={`p-2.5 rounded-xl border flex items-center gap-2.5 text-xs text-left transition-all ${
                      isSelected
                        ? 'border-stone-900 bg-stone-50 font-bold shadow-2xs'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full shrink-0 shadow-2xs"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span className="truncate text-stone-800">{c.id}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {suggestError && (
            <div className="p-3 rounded-2xl bg-rose-50 text-rose-800 border border-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{suggestError}</span>
            </div>
          )}
        </motion.div>
      )}

      {/* STEP NAVIGATION BUTTONS (1-4) */}
      {step <= 4 && (
        <div className="flex items-center justify-between gap-3 pt-2">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="px-5 py-3 rounded-2xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-semibold text-xs sm:text-sm transition-colors flex items-center gap-2 tap-target"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <Link
              to="/"
              className="px-5 py-3 rounded-2xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 font-semibold text-xs sm:text-sm transition-colors flex items-center gap-2 tap-target"
            >
              <span>Cancel</span>
            </Link>
          )}

          <button
            type="button"
            onClick={handleNext}
            disabled={loadingSuggestions}
            className="px-7 py-3 rounded-2xl bg-gradient-to-r from-rose-600 via-blush-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm shadow-elevated transition-all flex items-center gap-2 tap-target"
          >
            {loadingSuggestions ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Finding Perfect Matches...</span>
              </>
            ) : step === 4 ? (
              <>
                <Sparkles className="w-4 h-4 text-gold-200" />
                <span>Show Suggested Gifts</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}

      {/* STEP 5: SUGGESTIONS RESULTS (PRD F-31, F-32, F-33) */}
      {step === 5 && (
        <motion.div
          key="step-5"
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-8"
        >
          {/* Summary Card ("Your Custom Creation") */}
          <div className="bg-gradient-to-br from-cream-100 to-blush-50/60 rounded-3xl p-5 sm:p-7 border border-gold-300/70 shadow-soft">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold-200/60 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gold-700 block">
                  Curation Summary
                </span>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 mt-0.5">
                  Your Custom Creation Vision
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-white border border-stone-200 hover:border-blush-400 text-stone-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-blush-600" />
                <span>Edit Answers</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
              <div>
                <span className="text-stone-400 block uppercase tracking-wider text-[10px] font-bold">
                  Occasion
                </span>
                <span className="font-semibold text-stone-900 capitalize block mt-0.5">
                  {effectiveOccasionLabel}
                </span>
              </div>
              <div>
                <span className="text-stone-400 block uppercase tracking-wider text-[10px] font-bold">
                  Recipient
                </span>
                <span className="font-semibold text-stone-900 capitalize block mt-0.5">
                  {RECIPIENTS.find((r) => r.id === recipient)?.label || recipient}
                </span>
              </div>
              <div>
                <span className="text-stone-400 block uppercase tracking-wider text-[10px] font-bold">
                  Budget
                </span>
                <span className="font-semibold text-stone-900 block mt-0.5">
                  {BUDGET_OPTIONS.find((b) => b.id === budget)?.label || budget}
                </span>
              </div>
              <div>
                <span className="text-stone-400 block uppercase tracking-wider text-[10px] font-bold">
                  Style & Color
                </span>
                <span className="font-semibold text-stone-900 block mt-0.5 truncate">
                  {selectedColor}
                </span>
              </div>
            </div>
          </div>

          {/* Results List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-xl font-bold text-stone-900">
                  Recommended Creations ({suggestions.length})
                </h3>
                <p className="text-xs text-stone-500">
                  Scored and matched to your occasion, budget and style preferences
                </p>
              </div>
            </div>

            {suggestions.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 border border-stone-200 text-center space-y-4">
                <AlertCircle className="w-10 h-10 text-stone-400 mx-auto" />
                <h4 className="font-bold text-stone-800 text-base">No exact catalog item matched</h4>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  Our artisans specialize in bespoke requests. You can submit your customized idea directly to our studio.
                </p>
                <button
                  type="button"
                  onClick={() => navigate(`/create?occasion=${encodeURIComponent(effectiveOccasionLabel)}`)}
                  className="px-6 py-2.5 rounded-xl bg-blush-600 hover:bg-blush-700 text-white text-xs font-semibold"
                >
                  Create Bespoke Enquiry
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5">
                {suggestions.map(({ item, score, whyMatches }) => {
                  const itemImg = item.images?.[0]?.url
                    ? getOptimizedImageUrl(item.images[0].url, 500)
                    : 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80';

                  return (
                    <motion.div
                      key={item._id || item.id}
                      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-3xl p-4 sm:p-5 border border-blush-100/90 shadow-soft hover:shadow-elevated transition-all flex flex-col sm:flex-row gap-5 items-stretch"
                    >
                      {/* Image Thumbnail */}
                      <div className="w-full sm:w-48 h-48 sm:h-auto rounded-2xl overflow-hidden bg-stone-100 shrink-0 relative">
                        <img
                          src={itemImg}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-xs text-[10px] font-bold text-blush-700 shadow-2xs border border-blush-100">
                          {item.category}
                        </span>
                      </div>

                      {/* Content & Match Explanation */}
                      <div className="flex-1 flex flex-col justify-between space-y-3">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-rose-600">
                              Top Recommendation
                            </span>
                            {score && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {score}% match
                              </span>
                            )}
                          </div>

                          <h4 className="font-serif text-lg font-bold text-stone-900">
                            {item.title}
                          </h4>

                          {/* "Why this matches" line (PRD F-31) */}
                          <div className="p-2.5 rounded-xl bg-cream-50 border border-gold-200/70 text-xs text-stone-700 flex items-start gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-gold-600 shrink-0 mt-0.5" />
                            <p className="leading-relaxed">
                              <strong>Why this matches:</strong> {whyMatches}
                            </p>
                          </div>
                        </div>

                        {/* Price & Actions */}
                        <div className="pt-2 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-stone-400 block">
                              Estimated Pricing
                            </span>
                            <span className="font-serif text-lg font-bold text-stone-900">
                              {item.startingPrice ? `Starts at ₹${Number(item.startingPrice).toLocaleString('en-IN')}` : 'Price on request'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Link
                              to={`/items/${item.slug || item._id}`}
                              className="px-3.5 py-2.5 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-semibold transition-colors tap-target"
                            >
                              View Details
                            </Link>

                            {/* "Customize this" CTA opens create/order flow with prefill */}
                            <button
                              type="button"
                              onClick={() => handleCustomizeItem(item)}
                              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-blush-600 hover:from-rose-700 hover:to-blush-700 text-white text-xs font-semibold shadow-soft flex items-center gap-1.5 transition-all tap-target"
                            >
                              <Gift className="w-3.5 h-3.5 text-gold-200" />
                              <span>Customize this</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom Reset Action */}
          <div className="pt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setStep(1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-stone-900 py-2 px-4 rounded-xl hover:bg-stone-100 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Start over with different choices</span>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
