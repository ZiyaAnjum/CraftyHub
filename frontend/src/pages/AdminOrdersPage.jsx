import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Search,
  Filter,
  AlertTriangle,
  Calendar,
  Clock,
  Package,
  Phone,
  User,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';
import { formatKolkataDateTime, isOrderOverdue } from '../lib/date';

const STATUS_FILTERS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'placed', label: 'New / Placed' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'ready', label: 'Ready' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1,
  });

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (overdueOnly) params.append('overdue', 'true');
      params.append('page', String(page));
      params.append('limit', String(limit));

      const res = await api.get(`/api/admin/orders?${params.toString()}`);
      setOrders(res.orders || []);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      setError(err.message || 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, startDate, endDate, overdueOnly, page, limit]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setStartDate('');
    setEndDate('');
    setOverdueOnly(false);
    setPage(1);
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    statusFilter !== 'all' ||
    startDate !== '' ||
    endDate !== '' ||
    overdueOnly;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gold-700">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Workflow & Fulfilment</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight mt-0.5">
            Customer Orders
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Track customer custom requirements, set quotes & deadlines, and manage fulfillment.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchOrders}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-stone-50 text-stone-700 text-xs sm:text-sm font-semibold border border-stone-200 shadow-2xs transition-colors disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/90 shadow-2xs space-y-4">
        {/* Row 1: Search and Status Select */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <form
            onSubmit={handleSearchSubmit}
            className="md:col-span-6 relative"
          >
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order number, customer name, or phone..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-cream-50/50 border border-stone-200 text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-blush-500 focus:ring-1 focus:ring-blush-300"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          {/* Status Dropdown */}
          <div className="md:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-cream-50/50 border border-stone-200 text-xs sm:text-sm text-stone-800 focus:outline-none focus:border-blush-500"
            >
              {STATUS_FILTERS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Overdue Only Filter */}
          <div className="md:col-span-3 flex items-center">
            <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700 p-2 rounded-xl hover:bg-cream-50 select-none">
              <input
                type="checkbox"
                checked={overdueOnly}
                onChange={(e) => {
                  setOverdueOnly(e.target.checked);
                  setPage(1);
                }}
                className="w-4 h-4 text-blush-600 rounded border-stone-300 focus:ring-blush-400"
              />
              <span className="flex items-center gap-1 text-rose-700">
                <AlertTriangle className="w-3.5 h-3.5" />
                Overdue Only
              </span>
            </label>
          </div>
        </div>

        {/* Row 2: Date Range Filter & Reset */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-stone-100 text-xs">
          <span className="font-semibold text-stone-500 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>Placed Range:</span>
          </span>

          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white text-stone-700 text-xs"
            title="Start date"
          />
          <span className="text-stone-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white text-stone-700 text-xs"
            title="End date"
          />

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="ml-auto inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-semibold"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center shadow-soft">
          <Loader2 className="w-8 h-8 animate-spin text-blush-600 mx-auto" />
          <p className="mt-3 text-xs text-stone-500 font-medium">Loading orders list...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 text-center text-rose-800">
          <AlertCircle className="w-6 h-6 text-rose-600 mx-auto mb-2" />
          <p className="text-sm font-semibold">{error}</p>
          <button
            onClick={fetchOrders}
            className="mt-3 px-4 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700"
          >
            Retry Loading
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200/80 p-12 text-center shadow-soft space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-cream-100 text-stone-400 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-6 h-6 text-stone-400" />
          </div>
          <h3 className="font-serif text-lg font-bold text-stone-900">No Orders Found</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            {hasActiveFilters
              ? 'No orders matched your active filters or search terms. Try clearing filters.'
              : 'There are currently no customer orders in the system.'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="px-4 py-1.5 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800"
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View (Hidden on mobile) */}
          <div className="hidden md:block bg-white rounded-3xl border border-stone-200/90 shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-cream-50/80 text-stone-500 border-b border-stone-200/70 text-[11px] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-6">Order Number</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Item</th>
                    <th className="py-3.5 px-4">Placed At (IST)</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Ready By (IST)</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
                  {orders.map((order) => {
                    const overdue = isOrderOverdue(order);
                    const thumb =
                      order.item?.images?.[0]?.url ||
                      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=400&q=80';

                    return (
                      <tr
                        key={order.orderNumber}
                        className={`transition-colors hover:bg-cream-50/40 ${
                          overdue ? 'bg-rose-50/40' : ''
                        }`}
                      >
                        {/* Order Number */}
                        <td className="py-3.5 px-4 sm:px-6 font-mono font-bold text-blush-700 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            {overdue && (
                              <span title="Overdue order">
                                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                              </span>
                            )}
                            <Link
                              to={`/admin/orders/${order.orderNumber}`}
                              className="hover:underline"
                            >
                              {order.orderNumber}
                            </Link>
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-stone-900">
                            {order.customer?.name || 'Customer'}
                          </div>
                          <div className="text-[11px] text-stone-400 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <span>{order.customer?.phone}</span>
                          </div>
                        </td>

                        {/* Item */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5 max-w-[220px]">
                            <img
                              src={thumb}
                              alt={order.item?.title || 'Order'}
                              className="w-9 h-9 rounded-lg object-cover bg-stone-100 border border-stone-200 shrink-0"
                              loading="lazy"
                            />
                            <span className="truncate text-stone-800 font-medium">
                              {order.item?.title || 'Custom Enquiry'}
                            </span>
                          </div>
                        </td>

                        {/* Placed At */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-stone-600 text-[11px]">
                          {formatKolkataDateTime(order.createdAt)}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <StatusBadge status={order.status} />
                        </td>

                        {/* Ready By */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-[11px]">
                          {order.readyBy ? (
                            <span
                              className={
                                overdue
                                  ? 'text-rose-700 font-bold bg-rose-100/70 px-2 py-0.5 rounded-md border border-rose-200'
                                  : 'text-stone-700 font-medium'
                              }
                            >
                              {formatKolkataDateTime(order.readyBy)}
                            </span>
                          ) : (
                            <span className="text-stone-400 italic">Not set</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                          <Link
                            to={`/admin/orders/${order.orderNumber}`}
                            className="inline-flex items-center px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-blush-50 text-stone-700 hover:text-blush-700 font-semibold text-xs transition-colors"
                          >
                            Manage
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards View (Visible only on small screens) */}
          <div className="md:hidden space-y-3">
            {orders.map((order) => {
              const overdue = isOrderOverdue(order);
              return (
                <Link
                  key={order.orderNumber}
                  to={`/admin/orders/${order.orderNumber}`}
                  className={`block bg-white p-4 rounded-3xl border shadow-2xs space-y-3 transition-colors ${
                    overdue
                      ? 'border-rose-300 bg-rose-50/20'
                      : 'border-stone-200/90'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {overdue && <AlertTriangle className="w-4 h-4 text-rose-600" />}
                      <span className="font-mono text-sm font-bold text-blush-700">
                        {order.orderNumber}
                      </span>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>

                  <div className="flex items-center gap-3">
                    <img
                      src={
                        order.item?.images?.[0]?.url ||
                        'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=400&q=80'
                      }
                      alt="Thumbnail"
                      className="w-12 h-12 rounded-xl object-cover bg-stone-100 border border-stone-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-semibold text-stone-900 text-sm truncate">
                        {order.customer?.name || 'Customer'}
                      </div>
                      <div className="text-xs text-stone-500 truncate">
                        {order.item?.title || 'Custom Enquiry'}
                      </div>
                      <div className="text-[11px] text-stone-400">{order.customer?.phone}</div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                    <div>
                      <span>Placed: </span>
                      <span className="font-medium text-stone-700">
                        {formatKolkataDateTime(order.createdAt)}
                      </span>
                    </div>
                    {order.readyBy && (
                      <div>
                        <span>Ready: </span>
                        <span className={overdue ? 'text-rose-600 font-bold' : 'font-medium'}>
                          {formatKolkataDateTime(order.readyBy)}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-2xs flex items-center justify-between">
              <div className="text-xs text-stone-500">
                Showing page <span className="font-bold text-stone-800">{pagination.page}</span> of{' '}
                <span className="font-bold text-stone-800">{pagination.totalPages}</span> (
                {pagination.total} total orders)
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-40 transition-colors"
                  aria-label="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-40 transition-colors"
                  aria-label="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
