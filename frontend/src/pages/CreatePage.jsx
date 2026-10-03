import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useDraft } from '../hooks/useDraft';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../lib/api';
import { Gift, Sparkles, CheckCircle2, AlertCircle, ArrowRight, RotateCcw, Clock } from 'lucide-react';

export function CreatePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { draft, updateDraft, clearDraft } = useDraft();

  const [occasion, setOccasion] = useState(draft.occasion || 'Birthday');
  const [budget, setBudget] = useState(draft.budget || 2000);
  const [recipient, setRecipient] = useState(draft.recipient || '');
  const [customText, setCustomText] = useState(draft.customization?.text || '');
  const [font, setFont] = useState(draft.customization?.font || 'Elegant Serif');
  const [colour, setColour] = useState(draft.customization?.colour || 'Blush Pink');
  const [theme, setTheme] = useState(draft.customization?.theme || 'Floral');
  const [notes, setNotes] = useState(draft.customization?.notes || '');
  const [preferredDate, setPreferredDate] = useState(draft.preferredDate || '');

  const [submitting, setSubmitting] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [placedOrder, setPlacedOrder] = useState(null);

  // If URL has ?occasion=... or ?title=..., prioritize it
  useEffect(() => {
    const urlOccasion = searchParams.get('occasion');
    const urlTitle = searchParams.get('title');
    const patch = {};
    if (urlOccasion) {
      setOccasion(urlOccasion);
      patch.occasion = urlOccasion;
    }
    if (urlTitle) {
      patch.items = [{ name: urlTitle, qty: 1 }];
      const notesText = `Customizing: ${urlTitle}`;
      setNotes((prev) => prev || notesText);
      if (!notes) {
        patch.customization = { notes: notesText };
      }
    }
    if (Object.keys(patch).length > 0) {
      updateDraft(patch);
    }
  }, [searchParams, updateDraft, notes]);

  // Keep draft in sync with inputs
  const handleFieldChange = (setter, field, value) => {
    setter(value);
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: null }));
    }
    if (['text', 'font', 'colour', 'theme', 'notes'].includes(field)) {
      updateDraft({ customization: { [field]: value } });
    } else {
      updateDraft({ [field]: value });
    }
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const validateForm = () => {
    const errors = {};
    const trimmedOccasion = typeof occasion === 'string' ? occasion.trim() : '';
    if (!trimmedOccasion || trimmedOccasion.length < 2) {
      errors.occasion = 'Occasion must be between 2 and 60 characters';
    } else if (trimmedOccasion.length > 60) {
      errors.occasion = 'Occasion must be between 2 and 60 characters';
    }

    const numBudget = Number(budget);
    if (!Number.isFinite(numBudget) || numBudget < 0) {
      errors.budget = 'Budget must be a finite number greater than or equal to 0';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleResetDraft = () => {
    clearDraft();
    setOccasion('Birthday');
    setBudget(2000);
    setRecipient('');
    setCustomText('Happy Birthday!');
    setFont('Elegant Serif');
    setColour('Blush Pink');
    setTheme('Floral');
    setNotes('');
    setPreferredDate('');
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setFieldErrors({});

    if (!user) {
      navigate('/signin?next=/create');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const trimmedOccasion = typeof occasion === 'string' ? occasion.trim().slice(0, 60) : 'Birthday';
      const parsedBudget = Number(budget);
      const safeBudget = Number.isFinite(parsedBudget) ? Math.max(0, parsedBudget) : 0;

      const customization = {};
      if (typeof customText === 'string' && customText.trim()) {
        customization.text = customText.trim().slice(0, 200);
      }
      if (typeof font === 'string' && font.trim()) {
        customization.font = font.trim().slice(0, 40);
      }
      if (typeof colour === 'string' && colour.trim()) {
        customization.colour = colour.trim().slice(0, 40);
      }
      if (typeof theme === 'string' && theme.trim()) {
        customization.theme = theme.trim().slice(0, 40);
      }
      if (typeof notes === 'string' && notes.trim()) {
        customization.notes = notes.trim().slice(0, 1000);
      }

      let safePreferredDate;
      if (typeof preferredDate === 'string' && preferredDate.trim()) {
        const d = new Date(preferredDate);
        if (!isNaN(d.getTime())) {
          safePreferredDate = d.toISOString();
        }
      }

      const itemName = draft.items?.[0]?.name || `${trimmedOccasion} Bespoke Creation`;
      const orderPayload = {
        occasion: trimmedOccasion,
        budget: safeBudget,
        items: [{ name: itemName.slice(0, 120), qty: 1 }],
        customization,
        ...(safePreferredDate ? { preferredDate: safePreferredDate } : {}),
      };

      const result = await api.post('/api/orders', orderPayload);
      setPlacedOrder(result.order);
      clearDraft();
    } catch (err) {
      if (err instanceof ApiError) {
        if (Array.isArray(err.details) && err.details.length > 0) {
          const map = {};
          err.details.forEach((d) => {
            map[d.field] = d.message;
          });
          setFieldErrors(map);
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to submit order. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (placedOrder) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-stone-900">
          Enquiry Received!
        </h1>
        <p className="mt-2 text-stone-600 text-sm">
          Thank you, <span className="font-medium text-stone-800">{user?.name}</span>. Your custom gift request has been saved with Order ID:
        </p>
        <div className="my-6 inline-block px-5 py-2.5 rounded-xl bg-stone-100 font-mono text-lg font-bold text-blush-700 border border-stone-200">
          {placedOrder.orderId}
        </div>
        <p className="text-xs text-stone-500 max-w-sm mx-auto">
          We will review your custom notes, theme, and budget. You can track this order in your My Orders dashboard anytime.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/orders"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blush-600 text-white font-medium text-sm shadow-soft hover:bg-blush-700 transition-colors tap-target"
          >
            Track in My Orders
          </Link>
          <button
            onClick={() => setPlacedOrder(null)}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white border border-stone-200 text-stone-700 font-medium text-sm hover:bg-stone-50 transition-colors tap-target"
          >
            Create Another Gift
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold-600 uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Gift Builder</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-4xl font-bold text-stone-900 mt-1">
            Create Your Custom Gift
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Fill in your preferred details. Your draft is automatically saved in your browser.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {savedNotice && (
            <span className="text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1 animate-fade-in">
              <CheckCircle2 className="w-3 h-3" /> Draft auto-saved
            </span>
          )}
          <button
            type="button"
            onClick={handleResetDraft}
            className="text-xs text-stone-500 hover:text-stone-800 px-2.5 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 transition-colors flex items-center gap-1 tap-target"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Draft</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Unable to submit order</p>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Inputs (2 Columns) */}
        <form onSubmit={handleSubmitOrder} className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-blush-100 shadow-soft space-y-5">
            <h2 className="font-serif text-lg font-bold text-stone-900 border-b border-stone-100 pb-3">
              1. Occasion & Recipient
            </h2>

            <div>
              <label htmlFor="occasion" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Occasion
              </label>
              <select
                id="occasion"
                value={occasion}
                onChange={(e) => handleFieldChange(setOccasion, 'occasion', e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-cream-50/50 text-stone-800 focus:bg-white transition-colors ${
                  fieldErrors.occasion ? 'border-rose-400 focus:border-rose-500 ring-1 ring-rose-200' : 'border-stone-200'
                }`}
                required
              >
                <option value="Birthday">Birthday</option>
                <option value="Engagement">Engagement</option>
                <option value="Wedding">Wedding</option>
                <option value="Anniversary">Anniversary</option>
                <option value="Baby Shower">Baby Shower</option>
                <option value="Corporate / Festive">Corporate / Festive</option>
                <option value="Other Celebration">Other Celebration</option>
              </select>
              {fieldErrors.occasion && (
                <p className="text-[11px] text-rose-600 mt-1 pl-1">{fieldErrors.occasion}</p>
              )}
            </div>

            <div>
              <label htmlFor="recipient" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Recipient / Name on Gift
              </label>
              <input
                id="recipient"
                type="text"
                value={recipient}
                onChange={(e) => handleFieldChange(setRecipient, 'recipient', e.target.value)}
                placeholder="e.g. Sarah & Michael"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-cream-50/50 text-stone-800 text-sm focus:bg-white transition-colors"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="budget" className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
                  Target Budget (INR)
                </label>
                <span className="font-bold text-blush-600 text-sm">₹{Number(budget).toLocaleString('en-IN')}</span>
              </div>
              <input
                id="budget"
                type="range"
                min="500"
                max="25000"
                step="250"
                value={budget}
                onChange={(e) => handleFieldChange(setBudget, 'budget', Number(e.target.value))}
                className="w-full accent-blush-500 cursor-pointer"
              />
              {fieldErrors.budget && (
                <p className="text-[11px] text-rose-600 mt-1 pl-1">{fieldErrors.budget}</p>
              )}
              <div className="flex justify-between text-[11px] text-stone-400 mt-1">
                <span>₹500 (Mini tokens)</span>
                <span>₹5,000 (Grand Hampers)</span>
                <span>₹25,000+ (Luxury)</span>
              </div>
            </div>
          </div>

          {/* Customization Details */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-blush-100 shadow-soft space-y-5">
            <h2 className="font-serif text-lg font-bold text-stone-900 border-b border-stone-100 pb-3">
              2. Bespoke Styling & Message
            </h2>

            <div>
              <label htmlFor="customText" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Custom Inscription / Greeting Message
              </label>
              <input
                id="customText"
                type="text"
                value={customText}
                onChange={(e) => handleFieldChange(setCustomText, 'text', e.target.value)}
                placeholder="e.g. Always & Forever, Happy 25th Anniversary!"
                maxLength={200}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-cream-50/50 text-stone-800 text-sm focus:bg-white transition-colors"
              />
              <span className="text-[10px] text-stone-400 mt-1 block">Max 200 characters</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="colour" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Colour Palette
                </label>
                <select
                  id="colour"
                  value={colour}
                  onChange={(e) => handleFieldChange(setColour, 'colour', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-cream-50/50 text-stone-800 text-sm focus:bg-white transition-colors"
                >
                  <option value="Blush Pink & Rose Gold">Blush Pink & Rose Gold</option>
                  <option value="Ivory & Gold">Ivory & Gold</option>
                  <option value="Emerald & Cream">Emerald & Cream</option>
                  <option value="Midnight Blue & Silver">Midnight Blue & Silver</option>
                  <option value="Pastel Lavender">Pastel Lavender</option>
                  <option value="Rustic Earthy Tones">Rustic Earthy Tones</option>
                </select>
              </div>

              <div>
                <label htmlFor="theme" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Aesthetic Theme
                </label>
                <select
                  id="theme"
                  value={theme}
                  onChange={(e) => handleFieldChange(setTheme, 'theme', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-cream-50/50 text-stone-800 text-sm focus:bg-white transition-colors"
                >
                  <option value="Floral Romance">Floral Romance</option>
                  <option value="Modern Minimalist">Modern Minimalist</option>
                  <option value="Royal Vintage">Royal Vintage</option>
                  <option value="Boho Chic">Boho Chic</option>
                  <option value="Playful Celebration">Playful Celebration</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="preferredDate" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Preferred Delivery / Event Date (Optional)
              </label>
              <input
                id="preferredDate"
                type="date"
                value={preferredDate ? preferredDate.split('T')[0] : ''}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => handleFieldChange(setPreferredDate, 'preferredDate', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-cream-50/50 text-stone-800 text-sm focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label htmlFor="notes" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Special Requests or Notes for Fouzas
              </label>
              <textarea
                id="notes"
                rows={3}
                value={notes}
                onChange={(e) => handleFieldChange(setNotes, 'notes', e.target.value)}
                placeholder="Mention any specific items to include (e.g., personalized chocolate, scented candle, acrylic frame, fairy lights)..."
                maxLength={1000}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-cream-50/50 text-stone-800 text-sm focus:bg-white transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-blush-500 via-blush-600 to-rose-600 hover:from-blush-600 hover:to-rose-700 disabled:opacity-70 text-white font-semibold text-base shadow-elevated transition-all flex items-center justify-center gap-2 tap-target"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting your enquiry...
              </span>
            ) : (
              <>
                <Gift className="w-5 h-5 text-gold-300" />
                <span>Confirm & Submit Enquiry</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Live Draft Preview Card (1 Column) */}
        <div className="lg:col-span-1 space-y-4">
          <div className="sticky top-24 bg-white/95 rounded-3xl p-6 border border-blush-200/80 shadow-soft">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <span className="text-xs font-bold uppercase tracking-wider text-blush-600">
                Live Draft Preview
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Session active" />
            </div>

            <div className="mt-4 space-y-3.5 text-sm">
              {draft.items?.[0]?.name && draft.items[0].name !== 'Customized Gift Box' && (
                <div>
                  <span className="text-xs text-stone-400 block">Selected Gift Base</span>
                  <span className="font-serif font-bold text-blush-700 text-sm">{draft.items[0].name}</span>
                </div>
              )}

              <div>
                <span className="text-xs text-stone-400 block">Occasion</span>
                <span className="font-serif font-bold text-stone-900 text-base">{occasion}</span>
              </div>

              {recipient && (
                <div>
                  <span className="text-xs text-stone-400 block">Created for</span>
                  <span className="font-medium text-stone-800">{recipient}</span>
                </div>
              )}

              <div>
                <span className="text-xs text-stone-400 block">Estimated Budget</span>
                <span className="font-bold text-stone-900 text-lg">
                  ₹{Number(budget).toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-stone-400 block mt-0.5">
                  Final price confirmed upon review
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-cream-100/70 border border-gold-200/60 space-y-2">
                <span className="text-xs font-semibold text-stone-700 block">Preview Inscription</span>
                <p className="font-serif italic text-blush-700 text-sm">
                  "{customText || 'Your heartfelt greeting here'}"
                </p>
                <div className="text-[11px] text-stone-500 flex flex-wrap gap-2 pt-1 border-t border-gold-100">
                  <span>🎨 {colour}</span>
                  <span>✨ {theme}</span>
                </div>
              </div>

              {notes && (
                <div>
                  <span className="text-xs text-stone-400 block">Notes</span>
                  <p className="text-xs text-stone-600 line-clamp-3 italic">"{notes}"</p>
                </div>
              )}

              <div className="pt-3 border-t border-stone-100 text-[11px] text-stone-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Saved locally in your active session</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
