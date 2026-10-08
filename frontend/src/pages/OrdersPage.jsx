import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Package,
  RefreshCw,
  AlertCircle,
  Gift,
  Calendar,
  Clock,
  ArrowRight,
  Sparkles,
  MapPin,
  Store,
  CheckCircle2,
  XCircle,
  MessageCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';
import { OrderCardSkeleton } from '../components/Skeleton';
import { formatKolkataDateTime, formatKolkataDate } from '../lib/date';
import { getShopWhatsAppUrl } from '../lib/whatsapp';

const STATUS_STEPS = [
  { key: 'placed', label: 'Placed' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'ready', label: 'Ready' },
  { key: 'delivered', label: 'Delivered' },
];

export function OrdersPage() {
  const shouldReduceMotion = useReducedMotion();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [cancelError, setCancelError] = useState(null);
  const [expandedOrders, setExpandedOrders] = useState({});

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get('/api/orders/mine');
      setOrders(data.orders || []);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Unable to load orders. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const toggleExpand = (orderId) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const handleCancelOrder = async (order) => {
    const confirmCancel = window.confirm(
      `Are you sure you want to cancel order #${order.orderNumber}?`
    );
    if (!confirmCancel) return;

    setCancellingOrderId(order.orderNumber);
    setCancelError(null);

    try {
      const res = await api.patch(`/api/orders/${order.orderNumber}/cancel`);
      // Update locally
      setOrders((prev) =>
        prev.map((o) => (o.orderNumber === order.orderNumber ? res.order : o))
      );
    } catch (err) {
      setCancelError(err.message || 'Failed to cancel order.');
    } finally {
      setCancellingOrderId(null);
    }
  };

  const getStepIndex = (status) => {
    if (status === 'cancelled') return -1;
    return STATUS_STEPS.findIndex((s) => s.key === status);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blush-100 pb-5">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
            My Orders
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Track crafting milestones, quoted prices, and ready schedules for your custom gifts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchOrders}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl border border-stone-200 bg-white text-stone-600 hover:text-stone-900 text-xs font-medium shadow-xs transition-colors flex items-center gap-1.5 tap-target"
            title="Refresh orders"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <Link
            to="/create"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blush-500 to-rose-600 hover:from-blush-600 hover:to-rose-700 text-white text-xs font-semibold shadow-soft transition-all flex items-center gap-1.5 tap-target"
          >
            <Gift className="w-3.5 h-3.5" />
            <span>New Custom Gift</span>
          </Link>
        </div>
      </div>

      {cancelError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{cancelError}</span>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && (
        <div className="space-y-4">
          <OrderCardSkeleton />
          <OrderCardSkeleton />
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="font-serif font-bold text-rose-900 text-lg">Unable to Load Orders</h3>
          <p className="text-xs text-rose-700 max-w-md mx-auto">{error}</p>
          <button
            type="button"
            onClick={fetchOrders}
            className="px-5 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors shadow-soft tap-target"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Friendly Empty State */}
      {!loading && !error && orders.length === 0 && (
        <div className="bg-white rounded-3xl border border-blush-100 p-8 sm:p-12 text-center shadow-soft space-y-4">
          <div className="w-16 h-16 rounded-full bg-blush-50 text-blush-500 mx-auto flex items-center justify-center border border-blush-100">
            <Package className="w-8 h-8" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-stone-900">
            No Orders Yet
          </h2>
          <p className="text-stone-500 text-sm max-w-sm mx-auto leading-relaxed">
            You haven't placed any custom creations with Fouzas Creation yet. Start crafting a bespoke keepsake frame or luxury celebration hamper today!
          </p>
          <div className="pt-2">
            <Link
              to="/create"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-blush-500 via-blush-600 to-rose-600 text-white font-semibold text-sm shadow-elevated hover:from-blush-600 hover:to-rose-700 transition-all tap-target"
            >
              <Sparkles className="w-4 h-4 text-gold-300" />
              <span>Create Your First Gift</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Orders List */}
      {!loading && !error && orders.length > 0 && (
        <div className="space-y-6">
          {orders.map((order) => {
            const currentStepIdx = getStepIndex(order.status);
            const isExpanded = Boolean(expandedOrders[order.orderNumber || order.id]);

            const itemTitle =
              order.itemSnapshot?.title || order.item?.title || 'Bespoke Custom Creation';
            const itemImage =
              order.itemSnapshot?.image || order.item?.images?.[0]?.url;

            const whatsappMsg = `Hello Fouzas Creation! Regarding my order #${order.orderNumber} for "${itemTitle}": could you please provide an update?`;
            const whatsappUrl = getShopWhatsAppUrl(whatsappMsg);

            return (
              <div
                key={order.orderNumber || order.id}
                className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-7 shadow-soft hover:shadow-md transition-shadow space-y-5"
              >
                {/* Header Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4">
                  <div className="flex items-center gap-3">
                    {itemImage ? (
                      <img
                        src={itemImage}
                        alt={itemTitle}
                        className="w-12 h-12 rounded-xl object-cover border border-stone-200 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-blush-50 text-blush-600 flex items-center justify-center shrink-0 border border-blush-100">
                        <Gift className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm sm:text-base font-bold text-blush-700">
                          #{order.orderNumber}
                        </span>
                        <span className="text-[11px] text-stone-400 font-medium">
                          • {formatKolkataDate(order.createdAt)}
                        </span>
                      </div>
                      <h3 className="font-serif font-bold text-stone-900 text-sm sm:text-base leading-snug">
                        {itemTitle}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <StatusBadge status={order.status} />
                  </div>
                </div>

                {/* Key Status Highlights Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Quoted Price Box */}
                  <div className="p-4 rounded-2xl bg-cream-50 border border-stone-200/70">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-400 block">
                      Quoted Price
                    </span>
                    <div className="mt-1">
                      {order.quotedPrice !== null && order.quotedPrice !== undefined ? (
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-serif font-bold text-stone-900 text-xl">
                            ₹{Number(order.quotedPrice).toLocaleString('en-IN')}
                          </span>
                          <span className="text-xs text-stone-400">INR</span>
                        </div>
                      ) : (
                        <p className="text-xs text-stone-600 font-medium italic mt-0.5">
                          Pending review by artisan
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Ready By Schedule Box */}
                  <div className="p-4 rounded-2xl bg-cream-50 border border-stone-200/70">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-400 block">
                      Ready-By Schedule
                    </span>
                    <div className="mt-1">
                      {order.readyBy ? (
                        <div className="flex items-center gap-1.5 text-stone-900 font-semibold text-sm">
                          <Clock className="w-4 h-4 text-blush-600 shrink-0" />
                          <span>{formatKolkataDateTime(order.readyBy)}</span>
                        </div>
                      ) : (
                        <p className="text-xs text-stone-600 font-medium italic mt-0.5">
                          We'll confirm your order and ready time soon
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Milestone Progress Bar */}
                {order.status === 'cancelled' ? (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>This order was cancelled.</span>
                  </div>
                ) : (
                  <div className="pt-2">
                    <div className="flex items-center justify-between relative overflow-x-auto pb-2 no-scrollbar">
                      {STATUS_STEPS.map((step, idx) => {
                        const isDone = currentStepIdx >= idx;
                        const isCurrent = order.status === step.key;

                        return (
                          <div key={step.key} className="flex-1 min-w-[65px] text-center relative">
                            {/* Connecting Bar */}
                            {idx < STATUS_STEPS.length - 1 && (
                              <div
                                className={`absolute left-1/2 right-[-50%] top-3 h-0.5 z-0 ${
                                  currentStepIdx > idx ? 'bg-emerald-500' : 'bg-stone-200'
                                }`}
                              />
                            )}

                            <div className="flex items-center justify-center">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold z-10 transition-colors ${
                                  isCurrent
                                    ? 'bg-blush-600 text-white ring-4 ring-blush-100'
                                    : isDone
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-stone-100 text-stone-400 border border-stone-200'
                                }`}
                              >
                                {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                              </div>
                            </div>

                            <span
                              className={`text-[10px] mt-1.5 block truncate px-1 ${
                                isCurrent
                                  ? 'font-bold text-blush-700'
                                  : isDone
                                  ? 'font-medium text-stone-700'
                                  : 'text-stone-400'
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Collapsible Details Drawer */}
                <div className="pt-2 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => toggleExpand(order.orderNumber || order.id)}
                    className="w-full flex items-center justify-between text-xs font-semibold text-stone-600 hover:text-stone-900 py-1 tap-target"
                  >
                    <span>{isExpanded ? 'Hide Full Order Details' : 'View Full Order Details'}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-3 pt-3 overflow-hidden text-xs text-stone-700"
                      >
                        {/* Requirements */}
                        {order.requirements && (
                          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/70">
                            <span className="font-bold text-stone-900 block mb-1">
                              Custom Requirements & Notes:
                            </span>
                            <p className="whitespace-pre-line text-stone-600 leading-relaxed">
                              {order.requirements}
                            </p>
                          </div>
                        )}

                        {/* Customization Options */}
                        {Array.isArray(order.customizationAnswers) && order.customizationAnswers.length > 0 && (
                          <div className="p-3.5 rounded-2xl bg-cream-50 border border-gold-200/60">
                            <span className="font-bold text-stone-900 block mb-1.5">
                              Customization Selections:
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                              {order.customizationAnswers.map((ans, idx) => (
                                <div key={idx} className="bg-white p-2 rounded-xl border border-stone-200">
                                  <strong className="text-stone-700 block">{ans.label}</strong>
                                  <span className="text-stone-600">{ans.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Reference Images */}
                        {Array.isArray(order.referenceImages) && order.referenceImages.length > 0 && (
                          <div>
                            <span className="font-bold text-stone-900 block mb-1.5">
                              Reference Photos ({order.referenceImages.length}):
                            </span>
                            <div className="flex gap-2.5 overflow-x-auto pb-1">
                              {order.referenceImages.map((img, idx) => (
                                <a
                                  key={idx}
                                  href={img.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-16 h-16 rounded-xl overflow-hidden border border-stone-200 shrink-0"
                                >
                                  <img
                                    src={img.url}
                                    alt={`Reference ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Fulfilment & Contact Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                          <div className="flex items-start gap-2">
                            {order.deliveryType === 'pickup' ? (
                              <>
                                <Store className="w-4 h-4 text-blush-600 shrink-0 mt-0.5" />
                                <div>
                                  <strong className="text-stone-900 block">Self-Pickup</strong>
                                  <span className="text-stone-500">Fouzas Studio, Bengaluru</span>
                                </div>
                              </>
                            ) : (
                              <>
                                <MapPin className="w-4 h-4 text-blush-600 shrink-0 mt-0.5" />
                                <div>
                                  <strong className="text-stone-900 block">Delivery Address</strong>
                                  <span className="text-stone-500">{order.customer?.address || '—'}</span>
                                </div>
                              </>
                            )}
                          </div>

                          <div className="flex items-start gap-2">
                            <Calendar className="w-4 h-4 text-blush-600 shrink-0 mt-0.5" />
                            <div>
                              <strong className="text-stone-900 block">Needed-By Date</strong>
                              <span className="text-stone-500">
                                {order.neededByDate ? formatKolkataDate(order.neededByDate) : 'Not specified'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Action Buttons Row */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {/* Cancellation allowed only while placed */}
                    {order.status === 'placed' && (
                      <button
                        type="button"
                        onClick={() => handleCancelOrder(order)}
                        disabled={cancellingOrderId === order.orderNumber}
                        className="px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors disabled:opacity-60 tap-target"
                      >
                        {cancellingOrderId === order.orderNumber ? 'Cancelling...' : 'Cancel Order'}
                      </button>
                    )}

                    <Link
                      to={`/track?orderNumber=${order.orderNumber}&phone=${order.customer?.phone || ''}`}
                      className="px-3.5 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold transition-colors tap-target"
                    >
                      Track
                    </Link>
                  </div>

                  {whatsappUrl && whatsappUrl !== '#' && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition-colors tap-target"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Ask on WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
