import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  RefreshCw,
  ShoppingBag,
  ExternalLink,
  Calendar,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronLeft,
  X,
  Clock,
  Sparkles,
  IndianRupee,
  Package,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { api } from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';
import { formatKolkataDateTime, formatKolkataDate } from '../lib/date';

export function AdminCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected customer for order history slide-over
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [customerOrdersData, setCustomerOrdersData] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
      });
      if (debouncedSearch.trim()) {
        params.set('search', debouncedSearch.trim());
      }
      const res = await api.get(`/api/admin/customers?${params.toString()}`);
      setCustomers(res.customers || []);
      if (res.pagination) {
        setPagination((prev) => ({
          ...prev,
          total: res.pagination.total,
          totalPages: res.pagination.totalPages,
        }));
      }
    } catch (err) {
      setError(err.message || 'Failed to load customers.');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, debouncedSearch]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Fetch per-customer order history when customer is selected
  const openCustomerOrders = async (customer) => {
    setSelectedCustomerId(customer.id);
    setCustomerOrdersData({ customer, orders: [] });
    try {
      setLoadingOrders(true);
      setOrdersError(null);
      const res = await api.get(`/api/admin/customers/${customer.id}/orders`);
      setCustomerOrdersData(res);
    } catch (err) {
      setOrdersError(err.message || 'Failed to load customer orders.');
    } finally {
      setLoadingOrders(false);
    }
  };

  const closeCustomerOrders = () => {
    setSelectedCustomerId(null);
    setCustomerOrdersData(null);
    setOrdersError(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gold-700">
            <Users className="w-3.5 h-3.5" />
            <span>Customer Directory</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight mt-0.5">
            Customers & Accounts
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Registered customer profiles, aggregate quoted spend, and per-customer order history.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchCustomers}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold border border-stone-200 shadow-2xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-4 shadow-soft flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, email address, or 10-digit phone number..."
            className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm rounded-2xl bg-cream-50/60 border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-blush-500/20 focus:border-blush-500 transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-stone-500 shrink-0 self-end sm:self-auto">
          <span>Total registered:</span>
          <span className="font-bold text-stone-900 px-2 py-0.5 rounded-full bg-cream-100 border border-stone-200">
            {pagination.total}
          </span>
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
            onClick={fetchCustomers}
            className="px-3 py-1 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Customers Data Table */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-soft overflow-hidden">
        {loading && customers.length === 0 ? (
          <div className="p-16 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blush-600 mx-auto" />
            <p className="mt-3 text-xs text-stone-500 font-medium">Loading customer accounts...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-cream-100 text-stone-400 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-base font-bold text-stone-800">No Customers Found</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              {debouncedSearch
                ? `No customer matched your search query "${debouncedSearch}". Try clearing the search box.`
                : 'No customer accounts registered yet in the system.'}
            </p>
            {debouncedSearch && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-cream-50/80 text-stone-500 border-b border-stone-200/70 text-[11px] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-6">Customer</th>
                    <th className="py-3.5 px-4">Contact</th>
                    <th className="py-3.5 px-4 text-center">Verification</th>
                    <th className="py-3.5 px-4 text-center">Orders Placed</th>
                    <th className="py-3.5 px-4 text-right">Quoted Spend</th>
                    <th className="py-3.5 px-4">Last Order</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
                  {customers.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-cream-50/40 transition-colors"
                    >
                      {/* Name & Joined */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="font-bold text-stone-900">{c.name}</div>
                        <div className="text-[11px] text-stone-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-stone-400" />
                          <span>Joined {formatKolkataDate(c.createdAt)}</span>
                        </div>
                      </td>

                      {/* Phone & Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-stone-800">
                          <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span className="font-mono text-xs">{c.phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-stone-500 mt-0.5">
                          <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span className="truncate max-w-[180px]">{c.email}</span>
                        </div>
                      </td>

                      {/* Verification Status */}
                      <td className="py-3.5 px-4 text-center">
                        {c.emailVerified ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Verified</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Pending</span>
                          </span>
                        )}
                      </td>

                      {/* Orders Count */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-2xl bg-cream-100 text-stone-800 font-bold text-xs border border-stone-200/70">
                          <ShoppingBag className="w-3 h-3 text-blush-600" />
                          <span>{c.orderCount}</span>
                        </span>
                      </td>

                      {/* Total Spend */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-mono font-bold text-stone-900 text-xs sm:text-sm">
                          {c.totalSpend > 0 ? (
                            `₹${Number(c.totalSpend).toLocaleString('en-IN')}`
                          ) : (
                            <span className="text-stone-400 font-normal italic">₹0</span>
                          )}
                        </div>
                      </td>

                      {/* Last Order Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-stone-600">
                        {c.lastOrderDate ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-stone-800">
                              {formatKolkataDate(c.lastOrderDate)}
                            </span>
                            <span className="text-[10px] text-stone-400">
                              {formatKolkataDateTime(c.lastOrderDate).split(',')[1]}
                            </span>
                          </div>
                        ) : (
                          <span className="text-stone-400 italic text-[11px]">No orders yet</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openCustomerOrders(c)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blush-50 hover:bg-blush-100 text-blush-800 text-xs font-semibold border border-blush-200/60 transition-colors shadow-2xs"
                        >
                          <ShoppingBag className="w-3 h-3" />
                          <span>Order History</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="p-4 border-t border-stone-100 flex items-center justify-between bg-cream-50/40">
                <div className="text-xs text-stone-500">
                  Showing Page <span className="font-bold text-stone-800">{pagination.page}</span> of{' '}
                  <span className="font-bold text-stone-800">{pagination.totalPages}</span> ({pagination.total} total)
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page <= 1}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold border border-stone-200 shadow-2xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                    disabled={pagination.page >= pagination.totalPages}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold border border-stone-200 shadow-2xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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

      {/* Per-Customer Order History Slide-over Drawer */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-stone-900/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-5 border-b border-stone-200/90 bg-cream-50/60 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-serif text-xl font-bold text-stone-900">
                    {customerOrdersData?.customer?.name || 'Customer Orders'}
                  </h2>
                  {customerOrdersData?.customer?.emailVerified ? (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      Unverified
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-stone-400" />
                    <span className="font-mono">{customerOrdersData?.customer?.phone}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-stone-400" />
                    <span>{customerOrdersData?.customer?.email}</span>
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={closeCustomerOrders}
                className="p-2 rounded-2xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                aria-label="Close Drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Saved Address if present */}
            {customerOrdersData?.customer?.savedAddress && (
              <div className="px-5 py-2.5 bg-amber-50/40 border-b border-amber-100 text-xs text-stone-700 flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-gold-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-stone-900">Delivery Address: </span>
                  <span>{customerOrdersData.customer.savedAddress}</span>
                </div>
              </div>
            )}

            {/* Drawer Body: Orders List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {loadingOrders ? (
                <div className="py-20 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blush-600 mx-auto" />
                  <p className="mt-2 text-xs text-stone-500">Loading order history...</p>
                </div>
              ) : ordersError ? (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  {ordersError}
                </div>
              ) : !customerOrdersData?.orders || customerOrdersData.orders.length === 0 ? (
                <div className="py-20 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-cream-100 text-stone-400 flex items-center justify-center mx-auto">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <h4 className="font-serif font-bold text-stone-800">No Orders Yet</h4>
                  <p className="text-xs text-stone-500 max-w-xs mx-auto">
                    This customer has created an account but hasn't submitted any custom gift orders yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-stone-500 pb-1">
                    <span>
                      {customerOrdersData.orders.length} Order{customerOrdersData.orders.length > 1 ? 's' : ''} Placed
                    </span>
                    <span>Most Recent First</span>
                  </div>

                  {customerOrdersData.orders.map((order) => {
                    const isHamper = !!order.hamper?.items?.length;
                    const displayTitle = isHamper
                      ? `Custom Hamper (${order.hamper.base?.name || 'Hamper'})`
                      : order.item?.title || order.itemSnapshot?.title || 'Custom Creation';

                    return (
                      <div
                        key={order.orderNumber || order.id}
                        className="p-4 rounded-2xl border border-stone-200 bg-white hover:border-stone-300 transition-all shadow-2xs space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs sm:text-sm text-blush-700">
                                {order.orderNumber}
                              </span>
                              <StatusBadge status={order.status} />
                            </div>
                            <h4 className="font-serif font-bold text-stone-900 mt-1">
                              {displayTitle}
                            </h4>
                            <p className="text-[11px] text-stone-400">
                              Placed on {formatKolkataDateTime(order.createdAt)}
                            </p>
                          </div>

                          <div className="text-right">
                            <div className="font-mono font-bold text-stone-900 text-sm">
                              {order.quotedPrice !== null && order.quotedPrice > 0 ? (
                                `₹${Number(order.quotedPrice).toLocaleString('en-IN')}`
                              ) : (
                                <span className="text-stone-400 text-xs italic font-sans">Quote Pending</span>
                              )}
                            </div>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                              {order.deliveryType}
                            </span>
                          </div>
                        </div>

                        {/* Hamper contents summary if hamper */}
                        {isHamper && (
                          <div className="p-2.5 rounded-xl bg-cream-50/80 border border-stone-100 text-xs text-stone-700">
                            <div className="font-semibold text-stone-800 text-[11px] mb-1">
                              Hamper Items ({order.hamper.items.reduce((s, i) => s + i.quantity, 0)} items):
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {order.hamper.items.map((hi, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded-md bg-white border border-stone-200 text-[11px] text-stone-700 font-medium"
                                >
                                  {hi.title} × {hi.quantity}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Order Footer & Action */}
                        <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                          <div className="text-[11px] text-stone-500">
                            {order.occasion ? (
                              <span>Occasion: <strong className="text-stone-700">{order.occasion}</strong></span>
                            ) : (
                              <span className="text-stone-400 italic">No occasion specified</span>
                            )}
                          </div>

                          <Link
                            to={`/admin/orders/${order.orderNumber}`}
                            onClick={closeCustomerOrders}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blush-700 hover:text-blush-800 hover:underline"
                          >
                            <span>Manage Order</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-stone-200 bg-cream-50/50 flex justify-end">
              <button
                type="button"
                onClick={closeCustomerOrders}
                className="px-4 py-2 rounded-xl bg-white border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-2xs"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
