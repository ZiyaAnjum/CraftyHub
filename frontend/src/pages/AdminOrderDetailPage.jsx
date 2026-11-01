import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ShoppingBag,
  User,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Sparkles,
  DollarSign,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Send,
  Loader2,
  X,
  ExternalLink,
  Save,
  MessageCircle,
  Eye,
  History,
  AlertCircle,
  Package,
  Film,
  Play,
  Music,
} from 'lucide-react';
import { api } from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';
import {
  formatKolkataDateTime,
  formatKolkataDate,
  formatKolkataTime,
  toKolkataDateTimeLocalInput,
  isOrderOverdue,
} from '../lib/date';
import { formatWhatsAppChatUrl } from '../lib/whatsapp';

const isHttpUrl = (val) => {
  if (typeof val !== 'string') return false;
  try {
    const parsed = new URL(val);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const GIFT_STATUS_OPTIONS = [
  { value: 'placed', label: 'New / Placed' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'ready', label: 'Ready' },
  { value: 'delivered', label: 'Delivered (Terminal)' },
  { value: 'cancelled', label: 'Cancelled (Terminal)' },
];

const VIDEO_STATUS_OPTIONS = [
  { value: 'placed', label: 'Order Received' },
  { value: 'confirmed', label: 'Confirmed & Scheduled' },
  { value: 'in_progress', label: 'In Production' },
  { value: 'draft_shared', label: 'Draft Shared' },
  { value: 'changes_requested', label: 'Changes Requested' },
  { value: 'ready', label: 'Final Video Ready' },
  { value: 'delivered', label: 'Delivered (Terminal)' },
  { value: 'cancelled', label: 'Cancelled (Terminal)' },
];

export function AdminOrderDetailPage() {
  const { orderNumber } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form State
  const [status, setStatus] = useState('placed');
  const [readyByInput, setReadyByInput] = useState('');
  const [quotedPrice, setQuotedPrice] = useState('');
  const [deliveryLink, setDeliveryLink] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [historyNote, setHistoryNote] = useState('');
  const [forceOverride, setForceOverride] = useState(false);

  // Submission & Toast
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [formError, setFormError] = useState(null);

  // Lightbox Modal State
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchOrderDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/api/admin/orders/${orderNumber}`);
      const data = res.order;
      setOrder(data);

      // Populate form controls
      setStatus(data.status || 'placed');
      setReadyByInput(toKolkataDateTimeLocalInput(data.readyBy));
      setQuotedPrice(
        data.quotedPrice !== null && data.quotedPrice !== undefined ? String(data.quotedPrice) : ''
      );
      setDeliveryLink(data.deliveryLink || '');
      setCustomerNote(data.customerNote || '');
      setAdminNotes(data.adminNotes || '');
      setHistoryNote('');
      setForceOverride(false);
    } catch (err) {
      setError(err.message || 'Failed to load order details.');
    } finally {
      setLoading(false);
    }
  }, [orderNumber]);

  useEffect(() => {
    fetchOrderDetail();
  }, [fetchOrderDetail]);

  // Handle Form Submit
  const handleSaveOrder = async (e) => {
    e.preventDefault();
    setFormError(null);

    // Validation 1: Confirm requires readyBy
    if (status === 'confirmed') {
      const hasReadyBy = readyByInput || order.readyBy;
      if (!hasReadyBy) {
        setFormError('A Ready-By date & time is required when setting status to "Confirmed".');
        return;
      }
    }

    // Validation 2: Moving out of delivered/cancelled requires override
    const isTerminalCurrent = ['delivered', 'cancelled'].includes(order.status);
    if (isTerminalCurrent && status !== order.status && !forceOverride) {
      setFormError(
        `This order is ${order.status}. Please check the "Confirm status override" box to re-open it.`
      );
      return;
    }

    // Validation 3: Delivery link for video orders
    if (order.orderType === 'video') {
      const linkTrimmed = deliveryLink.trim();
      if (linkTrimmed && !isHttpUrl(linkTrimmed)) {
        setFormError('Video Delivery Link must be a valid HTTP or HTTPS URL (e.g. Google Drive, Dropbox, Cloudflare).');
        return;
      }
      if (['ready', 'delivered'].includes(status) && !linkTrimmed) {
        setFormError('A valid Video Delivery Link (HTTP or HTTPS URL) is required before moving a video order to Ready or Delivered.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      let readyByPayload = null;
      if (readyByInput) {
        // Date input is in Asia/Kolkata; attach IST offset +05:30 if needed
        const isoString = readyByInput.includes('+')
          ? new Date(readyByInput).toISOString()
          : new Date(`${readyByInput}:00+05:30`).toISOString();
        readyByPayload = isoString;
      }

      const pricePayload = quotedPrice.trim() !== '' ? parseFloat(quotedPrice) : null;

      const payload = {
        status,
        readyBy: readyByPayload,
        quotedPrice: pricePayload,
        customerNote: customerNote.trim(),
        adminNotes: adminNotes.trim(),
        note: historyNote.trim() || undefined,
        forceStatusOverride: forceOverride,
        ...(order.orderType === 'video' ? { deliveryLink: deliveryLink.trim() } : {}),
      };

      const res = await api.patch(`/api/admin/orders/${order.orderNumber || order._id}`, payload);
      setOrder(res.order);
      setHistoryNote('');
      setForceOverride(false);
      showToast('Order details & status successfully updated!');
    } catch (err) {
      setFormError(err.message || 'Failed to save order updates.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // WhatsApp click-to-chat generator
  const getWhatsAppLink = () => {
    if (!order?.customer?.phone) return '#';
    const isVideo = order.orderType === 'video';
    const statusOptions = isVideo ? VIDEO_STATUS_OPTIONS : GIFT_STATUS_OPTIONS;
    const statusLabel =
      statusOptions.find((s) => s.value === order.status)?.label || order.status;
    const readyByFormatted = order.readyBy ? formatKolkataDateTime(order.readyBy) : 'to be confirmed';
    const orderTitle = isVideo
      ? (order.templateSnapshot?.title || order.template?.title || 'Custom Video Invitation')
      : (order.item?.title || (order.hamper ? (order.hamper.title || 'Custom Hamper') : 'Bespoke Gift'));

    const message = `Hello ${order.customer.name}, greetings from Fouzas Creation! ${isVideo ? '🎬' : '🎁'}\n\nRegarding your ${isVideo ? 'video invitation' : 'order'} #${order.orderNumber} (${orderTitle}):\n• Status: ${statusLabel}\n• Ready-By Date: ${readyByFormatted}${order.deliveryLink ? `\n• Video Download Link: ${order.deliveryLink}` : ''}\n\nPlease let us know if you have any questions or customization feedback!`;

    return formatWhatsAppChatUrl(order.customer.phone, message);
  };

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-blush-600 mx-auto" />
        <p className="text-xs text-stone-500 font-medium">Loading order #{orderNumber}...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-6 lg:p-10 max-w-4xl mx-auto space-y-4">
        <Link
          to="/admin/orders"
          className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Orders List</span>
        </Link>
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center text-rose-800 space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
          <h2 className="font-serif text-xl font-bold">Order Not Found</h2>
          <p className="text-xs text-rose-700">{error || 'Unable to locate this order.'}</p>
        </div>
      </div>
    );
  }

  const overdue = isOrderOverdue(order);
  const refImages = order.referenceImages || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-elevated text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in slide-in-from-bottom-3 duration-200 ${
            toast.type === 'error'
              ? 'bg-rose-600 text-white'
              : 'bg-stone-900 text-gold-300 border border-gold-400/30'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxIndex !== null && refImages[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={refImages[lightboxIndex].url}
              alt={`Reference ${lightboxIndex + 1}`}
              className="max-h-[80vh] w-auto rounded-2xl object-contain shadow-2xl border border-stone-800"
            />
            <div className="mt-3 text-xs text-white/70 font-mono">
              Reference Image {lightboxIndex + 1} of {refImages.length}
            </div>
          </div>
        </div>
      )}

      {/* Back button & Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 font-semibold mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Orders</span>
          </Link>

          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
              Order {order.orderNumber}
            </h1>
            <StatusBadge status={order.status} orderType={order.orderType} />
            {order.orderType === 'video' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Film className="w-3.5 h-3.5" />
                <span>Video Invitation</span>
              </span>
            )}
            {overdue && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                <AlertTriangle className="w-3.5 h-3.5" />
                Overdue
              </span>
            )}
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Placed at {formatKolkataDateTime(order.createdAt)} (Asia/Kolkata)
          </p>
        </div>

        {/* Action: WhatsApp Customer */}
        <a
          href={getWhatsAppLink()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-soft hover:shadow-elevated transition-all self-start sm:self-auto tap-target"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Message on WhatsApp</span>
        </a>
      </div>

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (Customer & Order Requirements) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Customer Information Card */}
          <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 text-stone-900 font-serif font-bold text-lg border-b border-stone-100 pb-3">
              <User className="w-4 h-4 text-gold-600" />
              <span>Customer Information</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 block">
                  Customer Name
                </span>
                <span className="font-bold text-stone-900 mt-0.5 block">
                  {order.customer?.name}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 block">
                  Phone Number
                </span>
                <a
                  href={`tel:${order.customer?.phone}`}
                  className="font-bold text-blush-700 hover:underline mt-0.5 block"
                >
                  {order.customer?.phone}
                </a>
              </div>

              {order.customer?.address && (
                <div className="sm:col-span-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 block">
                    Delivery Address
                  </span>
                  <span className="text-stone-700 mt-0.5 block leading-relaxed">
                    {order.customer.address}
                  </span>
                </div>
              )}

              {order.user?.email && (
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 block">
                    Account Email
                  </span>
                  <span className="text-stone-600 mt-0.5 block">{order.user.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Video Template card for Video Orders */}
          {order.orderType === 'video' ? (
            <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-6 shadow-2xs space-y-5">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2 text-stone-900 font-serif font-bold text-lg">
                  <Film className="w-5 h-5 text-indigo-600" />
                  <span>Video Template Specifications</span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Digital Delivery
                </span>
              </div>

              {/* Template Snapshot Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl bg-cream-50/80 border border-gold-200/60">
                <div className="relative w-20 h-24 rounded-xl overflow-hidden bg-stone-900 shrink-0 border border-stone-200 shadow-xs">
                  <img
                    src={
                      order.templateSnapshot?.thumbnailUrl ||
                      order.template?.thumbnailUrl ||
                      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=400&q=80'
                    }
                    alt={order.templateSnapshot?.title || order.template?.title || 'Template'}
                    className="w-full h-full object-cover"
                  />
                  {(order.templateSnapshot?.previewVideoUrl || order.template?.previewVideoUrl) && (
                    <a
                      href={order.templateSnapshot?.previewVideoUrl || order.template?.previewVideoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                      title="View Template Video Preview"
                    >
                      <Play className="w-5 h-5 fill-white" />
                    </a>
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gold-700 block">
                    Selected Template
                  </span>
                  <h4 className="font-serif font-bold text-stone-900 text-base">
                    {order.templateSnapshot?.title || order.template?.title || 'Custom Video Invitation'}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-stone-600">
                    <span className="font-semibold text-stone-900">
                      Base Price: ₹{Number(order.templateSnapshot?.basePrice ?? order.template?.basePrice ?? 0).toLocaleString('en-IN')}
                    </span>
                    <span>•</span>
                    <span className="px-2 py-0.5 rounded-full bg-white text-stone-700 font-semibold border border-stone-200 text-[11px]">
                      Mode: {order.customizationType === 'changes' ? 'With Custom Changes' : 'As-Is Template'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Event Date & Delivery Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div className="p-3.5 rounded-2xl bg-cream-50/50 border border-stone-200/70">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 block">
                    Event Date
                  </span>
                  <div className="font-bold text-stone-900 mt-1 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-stone-400" />
                    <span>{order.eventDate ? formatKolkataDate(order.eventDate) : 'Not Specified'}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-cream-50/50 border border-stone-200/70">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 block">
                    Delivery Type
                  </span>
                  <div className="font-bold text-stone-900 mt-1 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>Digital</span>
                  </div>
                </div>
              </div>

              {/* On-Screen Text Requirements */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 block">
                  On-Screen Text Details (Names, Dates, Venue, Inscriptions)
                </span>
                <div className="p-4 rounded-2xl bg-cream-50/60 border border-stone-200/80 text-xs sm:text-sm text-stone-900 whitespace-pre-wrap leading-relaxed font-sans">
                  {order.onScreenText || order.requirements || 'No on-screen text provided.'}
                </div>
              </div>

              {/* Customization Notes (if With Changes) */}
              {order.customizationNotes && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 block">
                    Customer's Customization Notes
                  </span>
                  <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-xs sm:text-sm text-stone-800 whitespace-pre-wrap leading-relaxed">
                    {order.customizationNotes}
                  </div>
                </div>
              )}

              {/* Music Preference */}
              {order.musicPreference && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 block">
                    Music / Audio Preference
                  </span>
                  <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/70 text-xs text-stone-800 flex items-center gap-2">
                    <Music className="w-4 h-4 text-stone-500 shrink-0" />
                    <span className="font-medium">{order.musicPreference}</span>
                  </div>
                </div>
              )}

              {/* Asset Links */}
              {Array.isArray(order.assetLinks) && order.assetLinks.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 block">
                    Customer Uploaded Asset Links ({order.assetLinks.length}):
                  </span>
                  <div className="space-y-1.5">
                    {order.assetLinks.map((link, idx) => (
                      <a
                        key={idx}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-stone-200 hover:border-blush-400 hover:bg-blush-50/40 text-xs text-stone-800 transition-colors group"
                      >
                        <span className="font-mono truncate max-w-md text-blush-700 group-hover:underline">
                          {link}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-stone-400 group-hover:text-blush-600 shrink-0 ml-2" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Delivery Link Status if already saved */}
              {order.deliveryLink && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-center justify-between">
                  <div className="min-w-0 pr-3">
                    <span className="font-bold block text-emerald-800">Current Final Video Delivery Link:</span>
                    <a
                      href={order.deliveryLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono truncate block text-emerald-700 hover:underline mt-0.5"
                    >
                      {order.deliveryLink}
                    </a>
                  </div>
                  <a
                    href={order.deliveryLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shrink-0"
                  >
                    Open Link
                  </a>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Item & Customization Requirements (GIFT ORDERS) */}
              <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 text-stone-900 font-serif font-bold text-lg border-b border-stone-100 pb-3">
                  <Package className="w-4 h-4 text-gold-600" />
                  <span>Creation Specifications</span>
                </div>

                {/* Item Snapshot if attached */}
                {order.item ? (
                  <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-cream-50/70 border border-gold-200/50">
                    <img
                      src={
                        order.item.images?.[0]?.url ||
                        'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=400&q=80'
                      }
                      alt={order.item.title}
                      className="w-14 h-14 rounded-xl object-cover border border-stone-200 bg-white shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gold-700 block">
                        Selected Item
                      </span>
                      <h4 className="font-semibold text-stone-900 text-sm truncate">
                        {order.item.title}
                      </h4>
                      <div className="text-xs text-stone-500 mt-0.5">
                        Category: {order.item.category} • Prep: {order.item.prepTimeDays || 2} days
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-stone-500 italic p-3 bg-stone-50 rounded-2xl">
                    Bespoke creation enquiry (no catalogue item linked).
                  </div>
                )}

                {/* Hamper Breakdown Card (F-40 to F-42) */}
                {order.hamper && (
                  <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 space-y-3">
                    <div className="flex items-center justify-between border-b border-amber-200/70 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-amber-700" />
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                            Custom Hamper Build
                          </span>
                          <h4 className="font-serif font-bold text-stone-900 text-sm">
                            {order.hamper.base?.name || 'Selected Base Box/Basket'}
                          </h4>
                        </div>
                      </div>
                      <span className="font-bold text-xs text-amber-900">
                        Base: ₹{order.hamper.base?.price || 0}
                      </span>
                    </div>

                    {Array.isArray(order.hamper.items) && order.hamper.items.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 block">
                          Enclosed Items ({order.hamper.items.reduce((s, i) => s + (i.quantity || 1), 0)} items total):
                        </span>
                        <div className="divide-y divide-amber-200/60 bg-white rounded-xl border border-amber-200/60 px-3">
                          {order.hamper.items.map((hItem, idx) => (
                            <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                              <div className="flex items-center gap-2 min-w-0">
                                {hItem.image && (
                                  <img
                                    src={hItem.image}
                                    alt={hItem.title}
                                    className="w-8 h-8 rounded-lg object-cover border border-stone-200 shrink-0"
                                  />
                                )}
                                <div className="min-w-0">
                                  <p className="font-semibold text-stone-900 truncate text-xs">{hItem.title}</p>
                                  <p className="text-[11px] text-stone-500">
                                    Qty: {hItem.quantity} × ₹{hItem.unitPrice}
                                  </p>
                                </div>
                              </div>
                              <span className="font-bold text-stone-900 text-xs shrink-0">
                                ₹{hItem.totalPrice || hItem.unitPrice * hItem.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {order.hamper.giftMessage && (
                      <div className="p-3 rounded-xl bg-white/90 border border-amber-200/70 text-xs text-amber-950">
                        <strong className="block text-[11px] font-semibold text-amber-800 mb-0.5">
                          Customer Gift Message for Inscription Card:
                        </strong>
                        <p className="italic whitespace-pre-wrap">"{order.hamper.giftMessage}"</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-amber-200/70 text-xs font-semibold text-amber-950">
                      <span>Server-Calculated Price Total:</span>
                      <span className="font-serif font-bold text-base text-blush-700">
                        ₹{order.quotedPrice !== null && order.quotedPrice !== undefined ? order.quotedPrice : order.hamper.calculatedTotal}
                      </span>
                    </div>
                  </div>
                )}

                {/* Custom Requirements Text */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 block">
                    Requirements & Custom Notes
                  </span>
                  <div className="p-4 rounded-2xl bg-cream-50/40 border border-stone-200/70 text-xs sm:text-sm text-stone-800 whitespace-pre-wrap leading-relaxed">
                    {order.requirements || 'No specific text instructions provided.'}
                  </div>
                </div>

                {/* Customer Needed-By Date */}
                {order.neededByDate && (
                  <div className="flex items-center gap-2 text-xs text-stone-600 bg-stone-50 p-3 rounded-2xl">
                    <Clock className="w-4 h-4 text-stone-400" />
                    <span>
                      Customer requested delivery by:{' '}
                      <strong className="text-stone-900">
                        {formatKolkataDate(order.neededByDate)}
                      </strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Reference Images with Lightbox */}
              <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-2 text-stone-900 font-serif font-bold text-lg">
                    <Sparkles className="w-4 h-4 text-gold-600" />
                    <span>Customer Reference Images</span>
                  </div>
                  <span className="text-xs font-semibold text-stone-400">
                    {refImages.length} image{refImages.length === 1 ? '' : 's'}
                  </span>
                </div>

                {refImages.length === 0 ? (
                  <p className="text-xs text-stone-400 italic">No reference photos uploaded.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {refImages.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setLightboxIndex(idx)}
                        className="group relative aspect-square rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 hover:ring-2 hover:ring-blush-400 transition-all text-left"
                      >
                        <img
                          src={img.url}
                          alt={`Reference ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1">
                          <Eye className="w-4 h-4" />
                          <span>View</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right Column (Admin Actions, Status Form & History Timeline) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Admin Management & Status Workflow Form */}
          <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-6 shadow-soft space-y-5">
            <div className="flex items-center gap-2 text-stone-900 font-serif font-bold text-lg border-b border-stone-100 pb-3">
              <ShoppingBag className="w-4 h-4 text-blush-600" />
              <span>Update Order Workflow</span>
            </div>

            {formError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">{formError}</div>
              </div>
            )}

            <form onSubmit={handleSaveOrder} className="space-y-4 text-xs sm:text-sm">
              {/* Status Select */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
                  Order Status *
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-blush-500 bg-white font-medium"
                >
                  {(order.orderType === 'video' ? VIDEO_STATUS_OPTIONS : GIFT_STATUS_OPTIONS).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Terminal Override Checkbox if currently delivered or cancelled */}
              {['delivered', 'cancelled'].includes(order.status) && status !== order.status && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                  <div className="font-semibold flex items-center gap-1.5 text-amber-800">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Terminal Status Warning</span>
                  </div>
                  <p>
                    This order is already marked as <strong>{order.status}</strong>. Changing its status requires explicit admin confirmation.
                  </p>
                  <label className="inline-flex items-center gap-2 cursor-pointer font-semibold select-none pt-1">
                    <input
                      type="checkbox"
                      checked={forceOverride}
                      onChange={(e) => setForceOverride(e.target.checked)}
                      className="w-4 h-4 text-blush-600 rounded border-stone-300"
                    />
                    <span>Confirm status override</span>
                  </label>
                </div>
              )}

              {/* Ready-By Date & Time Picker */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
                    Ready By (IST) {status === 'confirmed' ? '*' : ''}
                  </label>
                  {status === 'confirmed' && (
                    <span className="text-[10px] text-blush-700 font-bold uppercase">
                      Required
                    </span>
                  )}
                </div>
                <input
                  type="datetime-local"
                  value={readyByInput}
                  onChange={(e) => setReadyByInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-none focus:border-blush-500 font-medium bg-white"
                />
                <p className="text-[11px] text-stone-400">
                  Target date & time for delivery readiness (Asia/Kolkata).
                </p>
              </div>

              {/* Quoted Price */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
                  Quoted Final Price (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={quotedPrice}
                  onChange={(e) => setQuotedPrice(e.target.value)}
                  placeholder="e.g. 2400"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-blush-500 font-medium"
                />
              </div>

              {/* Video Delivery Link (Video orders only) */}
              {order.orderType === 'video' && (
                <div className="space-y-1.5 p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-indigo-950 uppercase tracking-wider">
                      Video Delivery Link {['ready', 'delivered'].includes(status) ? '*' : ''}
                    </label>
                    <span className="text-[10px] font-semibold text-indigo-700 bg-white px-2 py-0.5 rounded-full border border-indigo-200">
                      Cloud Drive / Download
                    </span>
                  </div>
                  <input
                    type="url"
                    value={deliveryLink}
                    onChange={(e) => setDeliveryLink(e.target.value)}
                    placeholder="https://drive.google.com/file/... or https://..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-indigo-200 text-xs sm:text-sm font-mono focus:outline-none focus:border-indigo-500 bg-white text-stone-900"
                  />
                  <p className="text-[11px] text-indigo-900/80">
                    Required when moving order to Ready or Delivered. Visible to customer upon completion.
                  </p>
                </div>
              )}

              {/* Customer-Visible Note (F-22, F-63) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
                    Customer-Visible Note
                  </label>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                    Visible to Customer
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  placeholder="Note visible to customer on My Orders and Tracking page (e.g., 'Artisan has started calligraphy on frame. Dispatched via Dunzo.')..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-none focus:border-blush-500"
                />
                <p className="text-[11px] text-stone-400">
                  Displayed directly to the customer on their order details and tracking view.
                </p>
              </div>

              {/* Internal Admin Notes */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
                  Internal Admin Notes
                </label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Private notes (supplier costs, custom ribbons, customer preferences)..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-none focus:border-blush-500"
                />
                <p className="text-[11px] text-stone-400">
                  Strictly private — never visible to the customer.
                </p>
              </div>

              {/* Status Change Log Note (optional) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
                  Timeline Change Note (Optional)
                </label>
                <input
                  type="text"
                  value={historyNote}
                  onChange={(e) => setHistoryNote(e.target.value)}
                  placeholder="e.g. Confirmed with customer over WhatsApp"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-none focus:border-blush-500"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-blush-600 hover:bg-blush-700 text-white font-semibold text-xs sm:text-sm shadow-soft hover:shadow-elevated transition-all disabled:opacity-50 tap-target"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Order Updates</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Status History Timeline */}
          <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 text-stone-900 font-serif font-bold text-lg border-b border-stone-100 pb-3">
              <History className="w-4 h-4 text-gold-600" />
              <span>Status History Timeline</span>
            </div>

            {(!order.statusHistory || order.statusHistory.length === 0) ? (
              <p className="text-xs text-stone-400 italic">No timeline entries yet.</p>
            ) : (
              <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
                {order.statusHistory.map((item, idx) => (
                  <div key={idx} className="relative">
                    {/* Bullet */}
                    <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-blush-600 ring-4 ring-white" />

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={item.status} orderType={order.orderType} />
                        <span className="text-[11px] text-stone-400">
                          {formatKolkataDateTime(item.changedAt)}
                        </span>
                      </div>
                      {item.note && (
                        <p className="text-xs text-stone-600 leading-relaxed bg-cream-50/50 p-2 rounded-xl border border-stone-100 mt-1">
                          {item.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
