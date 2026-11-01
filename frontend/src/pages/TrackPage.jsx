import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Search,
  Package,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Film,
} from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { StatusBadge, getOrderMilestoneSteps, getOrderStepIndex } from '../components/StatusBadge';
import { formatKolkataDateTime, formatKolkataDate } from '../lib/date';
import { getShopWhatsAppUrl, getOrderWhatsAppUrl } from '../lib/whatsapp';
import { useNoIndex } from '../hooks/useNoIndex';

export function TrackPage() {
  useNoIndex();
  const shouldReduceMotion = useReducedMotion();
  const [searchParams] = useSearchParams();

  const [orderNumber, setOrderNumber] = useState(searchParams.get('orderNumber') || '');
  const [phone, setPhone] = useState(searchParams.get('phone') || '');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);

  // Auto-search if both parameters are provided in URL
  useEffect(() => {
    const urlOrderNum = searchParams.get('orderNumber');
    const urlPhone = searchParams.get('phone');
    if (urlOrderNum && urlPhone) {
      setOrderNumber(urlOrderNum);
      setPhone(urlPhone);
      executeTrack(urlOrderNum, urlPhone);
    }
  }, [searchParams]);

  const executeTrack = async (numToSearch, phoneToSearch) => {
    const trimmedNum = (numToSearch || orderNumber).trim();
    const cleanPhone = (phoneToSearch || phone).replace(/\D/g, '');

    if (!trimmedNum || cleanPhone.length < 10) {
      setError('Please provide a valid order number and 10-digit mobile number.');
      return;
    }

    setLoading(true);
    setError(null);
    setOrder(null);

    try {
      const data = await api.post('/api/orders/track', {
        orderNumber: trimmedNum,
        phone: cleanPhone,
      });
      setOrder(data.order);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError('No order found with those details. Please check your order number and mobile number.');
      } else {
        setError(err.message || 'Unable to fetch order status. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    executeTrack();
  };

  const milestoneSteps = order ? getOrderMilestoneSteps(order.orderType, order.status) : [];
  const currentStepIdx = order ? getOrderStepIndex(order.orderType, order.status) : -1;

  const whatsappUrl = order
    ? getOrderWhatsAppUrl(order, 'status')
    : getShopWhatsAppUrl('Hello Fouzas Creation! I have a question regarding tracking my order.');

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-12 space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blush-50 text-blush-700 text-xs font-semibold border border-blush-100">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Real-time Order Status</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
          Track Your Custom Order
        </h1>
        <p className="text-sm text-stone-500 max-w-md mx-auto leading-relaxed">
          Enter your Order Number and registered 10-digit mobile number to check crafting and delivery progress.
        </p>
      </div>

      {/* Lookup Form */}
      <form
        onSubmit={handleFormSubmit}
        className="bg-white rounded-3xl p-5 sm:p-7 border border-blush-100/90 shadow-soft space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="track-orderNumber"
              className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5"
            >
              Order Number
            </label>
            <input
              id="track-orderNumber"
              type="text"
              required
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
              placeholder="e.g. FC-0001"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-cream-50/50 text-stone-900 font-mono text-sm focus:bg-white focus:border-blush-500 transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="track-phone"
              className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5"
            >
              10-Digit Mobile Number
            </label>
            <input
              id="track-phone"
              type="tel"
              required
              maxLength={13}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-cream-50/50 text-stone-900 text-sm focus:bg-white focus:border-blush-500 transition-colors"
            />
          </div>
        </div>

        <motion.button
          type="submit"
          disabled={loading}
          whileHover={shouldReduceMotion ? {} : { scale: 1.01 }}
          whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blush-500 via-blush-600 to-rose-600 hover:from-blush-600 hover:to-rose-700 disabled:opacity-70 text-white font-semibold text-sm shadow-soft transition-all flex items-center justify-center gap-2 tap-target"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Searching status...
            </span>
          ) : (
            <>
              <Search className="w-4 h-4" />
              <span>Track Order</span>
            </>
          )}
        </motion.button>
      </form>

      {/* Error State */}
      {error && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-3xl bg-rose-50 border border-rose-200/90 text-rose-900 text-sm flex items-start gap-3.5 shadow-xs"
        >
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-bold text-rose-950">Order Lookup Notice</h3>
            <p className="text-xs text-rose-700 leading-relaxed">{error}</p>
            {whatsappUrl && whatsappUrl !== '#' && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-800 hover:text-rose-950 underline mt-2"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Need help? Contact Fouzas on WhatsApp</span>
              </a>
            )}
          </div>
        </motion.div>
      )}

      {/* Order Status Result */}
      {order && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-3xl border border-blush-100 p-5 sm:p-7 shadow-elevated space-y-6"
        >
          {/* Top Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">
                Order Reference
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xl font-bold text-blush-700">
                  #{order.orderNumber}
                </span>
                {order.orderType === 'video' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold uppercase tracking-wider">
                    <Film className="w-3 h-3" />
                    Video
                  </span>
                )}
              </div>
            </div>

            <StatusBadge status={order.status} orderType={order.orderType} />
          </div>

          {/* Item & Price Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-cream-50 border border-stone-200/60">
              <span className="text-xs text-stone-400 font-medium uppercase tracking-wider block">
                {order.orderType === 'video' ? 'Video Template' : 'Item'}
              </span>
              <h3 className="font-serif font-bold text-stone-900 text-base mt-0.5">
                {order.itemTitle}
              </h3>
            </div>

            <div className="p-4 rounded-2xl bg-cream-50 border border-stone-200/60">
              <span className="text-xs text-stone-400 font-medium uppercase tracking-wider block">
                Quoted Price
              </span>
              <div className="mt-0.5">
                {order.quotedPrice !== null && order.quotedPrice !== undefined ? (
                  <span className="font-serif font-bold text-stone-900 text-lg">
                    ₹{Number(order.quotedPrice).toLocaleString('en-IN')}
                  </span>
                ) : order.orderType === 'video' ? (
                  <span className="text-xs font-medium text-stone-700">
                    Starting from ₹{Number(order.templateSnapshot?.basePrice || 0).toLocaleString('en-IN')} - final price confirmed by us
                  </span>
                ) : (
                  <span className="text-xs font-medium text-stone-600 italic">
                    Pending review by artisan
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Ready-By Info Box */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-amber-950 block">
                Ready-By Schedule
              </span>
              <p className="text-xs text-amber-800 leading-relaxed">
                {order.readyBy ? (
                  <>
                    Estimated completion:{' '}
                    <strong className="font-semibold">{formatKolkataDateTime(order.readyBy)}</strong>
                  </>
                ) : (
                  "We'll confirm your order and ready time soon. Our team is reviewing your requirements."
                )}
              </p>
            </div>
          </div>

          {/* Video Review State Alerts */}
          {order.orderType === 'video' && order.status === 'draft_shared' && (
            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <Film className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <strong className="font-bold text-indigo-950 block">Draft Shared for Review</strong>
                  <p className="text-indigo-800 leading-relaxed">
                    We have shared a preview draft of your video invitation! If you'd like any minor adjustments or revisions, request changes directly on WhatsApp.
                  </p>
                </div>
              </div>
              <a
                href={getOrderWhatsAppUrl(order, 'changes')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors shrink-0 tap-target"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Request changes on WhatsApp</span>
              </a>
            </div>
          )}

          {order.orderType === 'video' && order.status === 'changes_requested' && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs">
              <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <strong className="font-bold text-amber-950 block">Changes in Progress</strong>
                <p className="text-amber-800 leading-relaxed">
                  We received your change request. Our video designers are revising your video according to your notes and will share an updated draft soon.
                </p>
              </div>
            </div>
          )}

          {/* Final Video Download Callout (Only when ready or delivered and deliveryLink exists) */}
          {order.orderType === 'video' && order.deliveryLink && ['ready', 'delivered'].includes(order.status) && (
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-soft">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <strong className="text-emerald-950 font-bold text-sm block">
                    Your Final Video Is Ready!
                  </strong>
                  <span className="text-xs text-emerald-800">
                    Download your full HD 1080p MP4 file to share with family and friends.
                  </span>
                </div>
              </div>
              <a
                href={order.deliveryLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md transition-all shrink-0 tap-target"
              >
                <span>Watch / Download Video</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* Status Timeline */}
          {order.status === 'cancelled' ? (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
              This order was cancelled. If you would like to reactivate or request a new creation, please reach out to us.
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Milestone Timeline
              </h4>

              <div className="space-y-3">
                {milestoneSteps.map((step, idx) => {
                  const isDone = currentStepIdx >= idx;
                  const isCurrent = order.status === step.key;

                  // Find latest milestone timestamp if recorded in timeline
                  const historyEntry = [...(order.statusTimeline || [])].reverse().find((h) => h.status === step.key);

                  return (
                    <div key={step.key} className="flex items-start gap-3 relative">
                      {/* Vertical line connecting nodes */}
                      {idx < milestoneSteps.length - 1 && (
                        <div
                          className={`absolute left-[13px] top-[26px] bottom-[-14px] w-0.5 ${
                            currentStepIdx > idx ? 'bg-emerald-500' : 'bg-stone-200'
                          }`}
                        />
                      )}

                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 text-xs font-bold transition-colors ${
                          isCurrent
                            ? 'bg-blush-600 text-white ring-4 ring-blush-100'
                            : isDone
                            ? 'bg-emerald-500 text-white'
                            : 'bg-stone-100 text-stone-400 border border-stone-200'
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>

                      <div className="flex-1 pb-4">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span
                            className={`text-sm ${
                              isCurrent
                                ? 'font-bold text-blush-700'
                                : isDone
                                ? 'font-semibold text-stone-800'
                                : 'text-stone-400 font-medium'
                            }`}
                          >
                            {step.label}
                          </span>
                          {historyEntry?.changedAt && (
                            <span className="text-[11px] text-stone-400 font-mono">
                              {formatKolkataDateTime(historyEntry.changedAt)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone-500 mt-0.5">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            {whatsappUrl && whatsappUrl !== '#' && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition-colors flex items-center justify-center gap-2 tap-target"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Ask question on WhatsApp</span>
              </a>
            )}

            <button
              type="button"
              onClick={() => {
                setOrder(null);
                setOrderNumber('');
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:text-stone-900 text-xs font-medium transition-colors tap-target text-center"
            >
              Track Another Order
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
