import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Package,
  RefreshCw,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  Calendar,
  Phone,
  User,
  AlertCircle,
  Loader2,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { api } from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';
import {
  formatKolkataDateTime,
  formatKolkataDate,
  formatKolkataTime,
  isOrderOverdue,
  isOrderDueSoon,
} from '../lib/date';

export function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/api/admin/stats');
      setStats(res);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Derive "Needs Attention" orders:
  // - Status 'placed' (new orders)
  // - Overdue orders
  // - Orders due within 24 hours
  const recentOrders = stats?.recentOrders || [];
  const attentionOrders = recentOrders.filter(
    (order) =>
      order.status === 'placed' ||
      isOrderOverdue(order) ||
      isOrderDueSoon(order)
  );

  const counts = stats?.countsByStatus || {};
  const newCount = counts.placed || 0;
  const confirmedCount = counts.confirmed || 0;
  const inProgressCount = counts.in_progress || 0;
  const readyCount = counts.ready || 0;
  const overdueCount = stats?.overdueCount || 0;
  const todayCount = stats?.placedToday || 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gold-700">
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Operations & Performance</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight mt-0.5">
            Admin Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Real-time order statuses, pending deadlines, and priority alerts (Asia/Kolkata).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchStats}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold border border-stone-200 shadow-2xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-blush-600 hover:bg-blush-700 text-white text-xs font-semibold shadow-soft hover:shadow-elevated transition-all"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>View All Orders</span>
          </Link>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-3xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchStats}
            className="px-3 py-1 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !stats ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center shadow-soft">
          <Loader2 className="w-8 h-8 animate-spin text-blush-600 mx-auto" />
          <p className="mt-3 text-xs text-stone-500 font-medium">Loading dashboard overview...</p>
        </div>
      ) : (
        <>
          {/* Stat Cards Grid (6 metrics) */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
            {/* 1. New Orders */}
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-amber-200/70 shadow-2xs space-y-1.5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                  New Placed
                </span>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              </div>
              <div className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
                {newCount}
              </div>
              <p className="text-[11px] text-stone-400">Awaiting confirmation</p>
            </div>

            {/* 2. Confirmed */}
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-sky-200/70 shadow-2xs space-y-1.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-sky-700">
                Confirmed
              </div>
              <div className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
                {confirmedCount}
              </div>
              <p className="text-[11px] text-stone-400">Scheduled for crafting</p>
            </div>

            {/* 3. In Progress */}
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-purple-200/70 shadow-2xs space-y-1.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-purple-700">
                In Progress
              </div>
              <div className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
                {inProgressCount}
              </div>
              <p className="text-[11px] text-stone-400">Being customized</p>
            </div>

            {/* 4. Ready */}
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-emerald-200/70 shadow-2xs space-y-1.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                Ready
              </div>
              <div className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
                {readyCount}
              </div>
              <p className="text-[11px] text-stone-400">Ready for dispatch</p>
            </div>

            {/* 5. Overdue */}
            <div
              className={`p-4 sm:p-5 rounded-3xl border shadow-2xs space-y-1.5 transition-all ${
                overdueCount > 0
                  ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-200/50'
                  : 'bg-white border-stone-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider ${
                    overdueCount > 0 ? 'text-rose-700' : 'text-stone-500'
                  }`}
                >
                  Overdue
                </span>
                {overdueCount > 0 && <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
              </div>
              <div
                className={`text-2xl sm:text-3xl font-serif font-bold ${
                  overdueCount > 0 ? 'text-rose-700' : 'text-stone-900'
                }`}
              >
                {overdueCount}
              </div>
              <p className="text-[11px] text-stone-400">
                {overdueCount > 0 ? 'Needs urgent action' : 'All deadlines met'}
              </p>
            </div>

            {/* 6. Placed Today */}
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gold-300/60 shadow-2xs space-y-1.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-gold-700">
                Today (IST)
              </div>
              <div className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
                {todayCount}
              </div>
              <p className="text-[11px] text-stone-400">Orders placed today</p>
            </div>
          </div>

          {/* Section: Needs Attention */}
          <div className="bg-white rounded-3xl border border-stone-200/90 shadow-soft overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-stone-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  <h2 className="font-serif text-lg sm:text-xl font-bold text-stone-900">
                    Needs Attention
                  </h2>
                </div>
                <p className="text-xs text-stone-400 mt-0.5">
                  Orders requiring immediate admin review: new enquiries, past deadlines, or orders due within 24 hours.
                </p>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-bold bg-cream-100 text-stone-700 border border-stone-200">
                {attentionOrders.length} Priority Order{attentionOrders.length === 1 ? '' : 's'}
              </span>
            </div>

            {attentionOrders.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <h3 className="font-serif font-bold text-stone-800 text-base">
                  All Clear! No urgent orders
                </h3>
                <p className="text-xs text-stone-400 max-w-sm mx-auto">
                  There are no new unreviewed enquiries, overdue deadlines, or deliveries due within the next 24 hours.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {attentionOrders.map((order) => {
                  const overdue = isOrderOverdue(order);
                  const dueSoon = isOrderDueSoon(order);
                  const isNew = order.status === 'placed';

                  return (
                    <Link
                      key={order.orderNumber}
                      to={`/admin/orders/${order.orderNumber}`}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-cream-50/50 transition-colors group"
                    >
                      <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                        {/* Thumbnail */}
                        <div className="w-12 h-12 rounded-xl bg-stone-100 overflow-hidden border border-stone-200 shrink-0">
                          {order.item?.images?.[0]?.url ? (
                            <img
                              src={order.item.images[0].url}
                              alt={order.item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-400">
                              <Package className="w-5 h-5" />
                            </div>
                          )}
                        </div>

                        {/* Order info */}
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold text-blush-700">
                              {order.orderNumber}
                            </span>
                            <StatusBadge status={order.status} />

                            {overdue && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                <AlertTriangle className="w-3 h-3" />
                                Overdue
                              </span>
                            )}
                            {dueSoon && !overdue && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                <Clock className="w-3 h-3" />
                                Due within 24h
                              </span>
                            )}
                            {isNew && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gold-100 text-gold-800 border border-gold-200">
                                <Sparkles className="w-3 h-3" />
                                New Enquiry
                              </span>
                            )}
                          </div>

                          <div className="text-xs sm:text-sm font-semibold text-stone-900 truncate">
                            {order.customer?.name} •{' '}
                            <span className="font-normal text-stone-600">
                              {order.item?.title || 'Bespoke Order'}
                            </span>
                          </div>

                          <div className="text-[11px] text-stone-400 flex items-center gap-3 flex-wrap">
                            <span>Placed: {formatKolkataDateTime(order.createdAt)}</span>
                            {order.readyBy && (
                              <span className={overdue ? 'text-rose-600 font-semibold' : ''}>
                                Ready by: {formatKolkataDateTime(order.readyBy)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right action indicator */}
                      <div className="flex items-center gap-2 text-xs font-semibold text-blush-700 group-hover:text-blush-800 shrink-0 self-end sm:self-center">
                        <span>Review Order</span>
                        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section: 10 Most Recent Orders */}
          <div className="bg-white rounded-3xl border border-stone-200/90 shadow-soft overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h2 className="font-serif text-lg sm:text-xl font-bold text-stone-900">
                  Recent Activity
                </h2>
                <p className="text-xs text-stone-400 mt-0.5">
                  Latest 10 orders across all statuses.
                </p>
              </div>

              <Link
                to="/admin/orders"
                className="text-xs font-semibold text-blush-700 hover:text-blush-800 flex items-center gap-1"
              >
                <span>View All Orders</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <div className="p-10 text-center text-xs text-stone-400">
                No orders placed yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-cream-50/80 text-stone-500 border-b border-stone-200/70 text-[11px] uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4 sm:px-6">Order</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Item</th>
                      <th className="py-3 px-4">Placed At</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Ready By</th>
                      <th className="py-3 px-4 sm:px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
                    {recentOrders.map((o) => {
                      const overdue = isOrderOverdue(o);
                      return (
                        <tr
                          key={o.orderNumber}
                          className={`hover:bg-cream-50/40 transition-colors ${
                            overdue ? 'bg-rose-50/30' : ''
                          }`}
                        >
                          <td className="py-3 px-4 sm:px-6 font-mono font-bold text-blush-700">
                            {o.orderNumber}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-stone-900">{o.customer?.name}</div>
                            <div className="text-[11px] text-stone-400">{o.customer?.phone}</div>
                          </td>
                          <td className="py-3 px-4 max-w-[180px] truncate text-stone-700">
                            {o.item?.title || 'Custom Request'}
                          </td>
                          <td className="py-3 px-4 text-stone-500 whitespace-nowrap text-[11px]">
                            {formatKolkataDateTime(o.createdAt)}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <StatusBadge status={o.status} />
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-[11px]">
                            {o.readyBy ? (
                              <span className={overdue ? 'text-rose-600 font-bold' : 'text-stone-600'}>
                                {formatKolkataDateTime(o.readyBy)}
                              </span>
                            ) : (
                              <span className="text-stone-400 italic">Not set</span>
                            )}
                          </td>
                          <td className="py-3 px-4 sm:px-6 text-right whitespace-nowrap">
                            <Link
                              to={`/admin/orders/${o.orderNumber}`}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-blush-700 hover:text-blush-800 hover:underline"
                            >
                              <span>Manage</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
