import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';
import { OrderCardSkeleton } from '../components/Skeleton';
import { Package, RefreshCw, AlertCircle, Gift, Calendar, ArrowRight, Sparkles } from 'lucide-react';

const STATUS_STEPS = ['Received', 'Confirmed', 'In Progress', 'Ready', 'Delivered'];

export function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(new Date(dateString));
    } catch {
      return dateString;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blush-100 pb-5">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
            My Orders & Tracking
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Track status updates and custom creation details for all your orders.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
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
            className="px-4 py-2 rounded-xl bg-blush-600 text-white text-xs font-semibold hover:bg-blush-700 shadow-soft transition-colors flex items-center gap-1.5 tap-target"
          >
            <Gift className="w-3.5 h-3.5" />
            <span>New Gift</span>
          </Link>
        </div>
      </div>

      {/* Loading Skeletons */}
      {loading && (
        <div className="space-y-4">
          <OrderCardSkeleton />
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
            onClick={fetchOrders}
            className="px-5 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors shadow-soft tap-target"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Friendly Empty State */}
      {!loading && !error && orders.length === 0 && (
        <div className="bg-white rounded-3xl border border-blush-100/80 p-8 sm:p-12 text-center shadow-soft">
          <div className="w-16 h-16 rounded-full bg-blush-50 text-blush-500 mx-auto flex items-center justify-center mb-4 border border-blush-100">
            <Package className="w-8 h-8" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-stone-900">
            No Orders Yet
          </h2>
          <p className="text-stone-500 text-sm max-w-sm mx-auto mt-2 leading-relaxed">
            You haven't placed any gift requests with Fouzas Creation yet. Start crafting a custom hamper or keepsake frame today!
          </p>
          <div className="mt-6">
            <Link
              to="/create"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-blush-500 to-blush-600 text-white font-semibold text-sm shadow-elevated hover:from-blush-600 hover:to-blush-700 transition-all tap-target"
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
        <div className="space-y-5">
          {orders.map((order) => {
            const currentStepIdx = STATUS_STEPS.indexOf(order.status);
            return (
              <div
                key={order.orderId}
                className="bg-white rounded-3xl border border-stone-200/80 p-5 sm:p-7 shadow-soft hover:shadow-elevated transition-shadow space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4">
                  <div>
                    <span className="font-mono text-xs font-bold text-stone-400 block tracking-wider">
                      ORDER ID
                    </span>
                    <span className="font-mono text-sm font-bold text-blush-700">
                      {order.orderId}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-stone-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(order.createdAt)}
                    </span>
                    <StatusBadge status={order.status} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-xs text-stone-400 block">Occasion</span>
                    <span className="font-serif font-bold text-stone-900">{order.occasion}</span>
                  </div>
                  <div>
                    <span className="text-xs text-stone-400 block">Target Budget</span>
                    <span className="font-semibold text-stone-800">
                      ₹{Number(order.budget).toLocaleString('en-IN')}
                    </span>
                  </div>
                  {order.preferredDate && (
                    <div>
                      <span className="text-xs text-stone-400 block">Preferred Date</span>
                      <span className="text-stone-700">{formatDate(order.preferredDate)}</span>
                    </div>
                  )}
                </div>

                {/* Customization Details */}
                {order.customization && (
                  <div className="p-3.5 rounded-2xl bg-cream-50 border border-gold-200/50 space-y-1.5">
                    {order.customization.text && (
                      <p className="text-xs text-stone-700">
                        <strong className="font-semibold text-stone-900">Custom Inscription:</strong>{' '}
                        <span className="italic font-serif">"{order.customization.text}"</span>
                      </p>
                    )}
                    <div className="flex flex-wrap gap-3 text-[11px] text-stone-500">
                      {order.customization.theme && <span>Theme: {order.customization.theme}</span>}
                      {order.customization.colour && <span>Colour: {order.customization.colour}</span>}
                      {order.customization.font && <span>Font: {order.customization.font}</span>}
                    </div>
                    {order.customization.notes && (
                      <p className="text-xs text-stone-600 pt-1 border-t border-gold-100">
                        <strong className="font-semibold text-stone-800">Notes:</strong>{' '}
                        {order.customization.notes}
                      </p>
                    )}
                  </div>
                )}

                {/* Owner / Customer Note */}
                {order.customerNote && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                    <strong>Note from Fouzas:</strong> {order.customerNote}
                  </div>
                )}

                {/* Status Timeline Milestone Steps */}
                <div className="pt-2">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-400 block mb-2">
                    Milestone Progress
                  </span>
                  <div className="flex items-center justify-between relative overflow-x-auto pb-1 no-scrollbar">
                    {STATUS_STEPS.map((step, idx) => {
                      const isComplete = currentStepIdx >= idx && order.status !== 'Cancelled';
                      const isCurrent = order.status === step;

                      return (
                        <div key={step} className="flex-1 min-w-[70px] text-center relative">
                          <div className="flex items-center justify-center">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold z-10 transition-colors ${
                                isCurrent
                                  ? 'bg-blush-600 text-white ring-4 ring-blush-100'
                                  : isComplete
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-stone-200 text-stone-500'
                              }`}
                            >
                              {idx + 1}
                            </div>
                          </div>
                          <span
                            className={`text-[10px] mt-1.5 block truncate px-1 ${
                              isCurrent
                                ? 'font-bold text-blush-700'
                                : isComplete
                                ? 'font-medium text-stone-700'
                                : 'text-stone-400'
                            }`}
                          >
                            {step}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
