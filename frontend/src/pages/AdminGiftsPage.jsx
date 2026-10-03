import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Gift,
  Plus,
  Pencil,
  Trash2,
  Upload,
  Sparkles,
  Eye,
  EyeOff,
  Check,
  X,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../lib/api';

const CATEGORIES = ['Bouquet', 'Hamper', 'Frame', 'Engraved', 'Other'];

export function AdminGiftsPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGift, setEditingGift] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Delete modal state
  const [deletingGift, setDeletingGift] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Uploading state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  // Manual URL input helper
  const [manualImageUrl, setManualImageUrl] = useState('');

  // Form fields
  const [formData, setFormData] = useState({
    title: '',
    category: 'Hamper',
    price: '',
    priceNote: 'starts from',
    shortDescription: '',
    description: '',
    deliveryInfo: 'Delivered in 3-5 business days across India.',
    includes: '',
    customizationOptions: '',
    occasions: 'Birthday, Anniversary',
    isPublished: true,
    isFeatured: false,
    images: [],
  });

  const fetchGifts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/api/admin/gifts');
      setGifts(res.gifts || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch gifts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'admin') {
        navigate('/account');
        return;
      }
      fetchGifts();
    }
  }, [user, authLoading, navigate]);

  const handleOpenAddModal = () => {
    setEditingGift(null);
    setFormError(null);
    setUploadError(null);
    setFormData({
      title: '',
      category: 'Hamper',
      price: '',
      priceNote: 'starts from',
      shortDescription: '',
      description: '',
      deliveryInfo: 'Delivered in 3-5 business days across India.',
      includes: '',
      customizationOptions: '',
      occasions: 'Birthday, Anniversary',
      isPublished: true,
      isFeatured: false,
      images: [],
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (gift) => {
    setEditingGift(gift);
    setFormError(null);
    setUploadError(null);
    setFormData({
      title: gift.title || '',
      category: gift.category || 'Hamper',
      price: gift.price !== undefined ? String(gift.price) : '',
      priceNote: gift.priceNote || '',
      shortDescription: gift.shortDescription || '',
      description: gift.description || '',
      deliveryInfo: gift.deliveryInfo || '',
      includes: Array.isArray(gift.includes) ? gift.includes.join(', ') : '',
      customizationOptions: Array.isArray(gift.customizationOptions) ? gift.customizationOptions.join(', ') : '',
      occasions: Array.isArray(gift.occasions) ? gift.occasions.join(', ') : '',
      isPublished: gift.isPublished ?? true,
      isFeatured: gift.isFeatured ?? false,
      images: Array.isArray(gift.images) ? [...gift.images] : [],
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingGift(null);
    setFormError(null);
    setUploadError(null);
  };

  // Quick toggle Published
  const handleTogglePublished = async (gift) => {
    try {
      const nextState = !gift.isPublished;
      await api.put(`/api/admin/gifts/${gift._id}`, { isPublished: nextState });
      setGifts((prev) =>
        prev.map((g) => (g._id === gift._id ? { ...g, isPublished: nextState } : g))
      );
    } catch (err) {
      alert('Failed to update published status: ' + (err.message || 'Unknown error'));
    }
  };

  // Quick toggle Featured
  const handleToggleFeatured = async (gift) => {
    try {
      const nextState = !gift.isFeatured;
      await api.put(`/api/admin/gifts/${gift._id}`, { isFeatured: nextState });
      setGifts((prev) =>
        prev.map((g) => (g._id === gift._id ? { ...g, isFeatured: nextState } : g))
      );
    } catch (err) {
      alert('Failed to update featured status: ' + (err.message || 'Unknown error'));
    }
  };

  // Multi-image upload
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (formData.images.length + files.length > 6) {
      setUploadError(`Maximum 6 images allowed. You can only add ${6 - formData.images.length} more.`);
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    const uploaded = [];
    try {
      for (const file of files) {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          throw new Error(`File ${file.name} is not a valid JPEG, PNG, or WEBP image.`);
        }
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`File ${file.name} exceeds 5MB size limit.`);
        }

        const data = new FormData();
        data.append('image', file);
        const res = await api.post('/api/admin/gifts/upload', data);
        if (res?.url) {
          uploaded.push({ url: res.url, publicId: res.publicId || '' });
        }
      }

      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...uploaded],
      }));
    } catch (err) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Manual image URL add (fallback)
  const handleAddManualUrl = (e) => {
    e.preventDefault();
    if (!manualImageUrl.trim()) return;
    if (formData.images.length >= 6) {
      setUploadError('Maximum 6 images allowed.');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, { url: manualImageUrl.trim(), publicId: '' }],
    }));
    setManualImageUrl('');
    setUploadError(null);
  };

  const handleRemoveImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== index),
    }));
  };

  // Submit Add / Edit Form
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (formData.images.length < 1) {
      setFormError('At least 1 image is required.');
      return;
    }

    const priceNum = Number(formData.price);
    if (isNaN(priceNum) || priceNum < 0) {
      setFormError('Please enter a valid price (greater than or equal to 0).');
      return;
    }

    const parseList = (str) =>
      str
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

    const payload = {
      title: formData.title.trim(),
      category: formData.category,
      price: priceNum,
      priceNote: formData.priceNote.trim(),
      shortDescription: formData.shortDescription.trim(),
      description: formData.description.trim(),
      deliveryInfo: formData.deliveryInfo.trim(),
      includes: parseList(formData.includes),
      customizationOptions: parseList(formData.customizationOptions),
      occasions: parseList(formData.occasions),
      isPublished: Boolean(formData.isPublished),
      isFeatured: Boolean(formData.isFeatured),
      images: formData.images.map((img) => ({
        url: img.url,
        publicId: img.publicId || '',
      })),
    };

    setFormSubmitting(true);
    try {
      if (editingGift) {
        await api.put(`/api/admin/gifts/${editingGift._id}`, payload);
      } else {
        await api.post('/api/admin/gifts', payload);
      }
      await fetchGifts();
      handleCloseModal();
    } catch (err) {
      if (err instanceof ApiError && err.details) {
        const msg = err.details.map((d) => `${d.field}: ${d.message}`).join(', ');
        setFormError(msg || err.message);
      } else {
        setFormError(err.message || 'Failed to save gift.');
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  // Confirm and Execute Delete
  const handleConfirmDelete = async () => {
    if (!deletingGift) return;
    setDeleteSubmitting(true);
    try {
      await api.delete(`/api/admin/gifts/${deletingGift._id}`);
      setGifts((prev) => prev.filter((g) => g._id !== deletingGift._id));
      setDeletingGift(null);
    } catch (err) {
      alert('Failed to delete gift: ' + (err.message || 'Unknown error'));
    } finally {
      setDeleteSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blush-600 mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 uppercase tracking-widest">
            <Link to="/account" className="inline-flex items-center gap-1 hover:underline">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Account</span>
            </Link>
            <span>/</span>
            <span>Admin Control</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
            Manage Gift Catalog
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Add new creations, update pricing, manage gallery photos, and toggle store visibility.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blush-600 hover:bg-blush-700 text-white font-semibold text-sm shadow-soft transition-colors tap-target self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Gift</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Gifts List */}
      {loading ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-200/80 shadow-soft">
          <Loader2 className="w-8 h-8 animate-spin text-blush-600 mx-auto mb-2" />
          <p className="text-stone-500 text-sm">Loading gift catalog...</p>
        </div>
      ) : gifts.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-200/80 shadow-soft space-y-4">
          <Gift className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="font-serif text-lg font-bold text-stone-900">No Gifts in Catalog</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            You haven't created any gifts yet. Click "Add New Gift" to add your first creation.
          </p>
          <button
            onClick={handleOpenAddModal}
            className="px-5 py-2 rounded-xl bg-blush-600 text-white font-semibold text-xs shadow-soft"
          >
            Add Gift
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-stone-200/80 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-stone-700">
              <thead className="bg-stone-50 border-b border-stone-200/80 text-[11px] uppercase tracking-wider font-semibold text-stone-500">
                <tr>
                  <th className="py-3.5 px-4">Gift</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4 text-center">Published</th>
                  <th className="py-3.5 px-4 text-center">Featured</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {gifts.map((gift) => {
                  const thumb = gift.images?.[0]?.url || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=200&q=80';
                  return (
                    <tr key={gift._id} className="hover:bg-cream-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={thumb}
                            alt={gift.title}
                            className="w-12 h-12 rounded-xl object-cover bg-stone-100 shrink-0 border border-stone-200"
                          />
                          <div className="min-w-0">
                            <Link
                              to={`/gifts/${gift.slug}`}
                              target="_blank"
                              className="font-serif font-bold text-stone-900 hover:text-blush-600 transition-colors line-clamp-1 text-sm"
                            >
                              {gift.title}
                            </Link>
                            <span className="text-[11px] text-stone-400 block truncate">
                              /{gift.slug}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 text-xs font-medium">
                          {gift.category}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-semibold text-stone-900">
                          ₹{Number(gift.price).toLocaleString('en-IN')}
                        </span>
                        {gift.priceNote && (
                          <span className="text-[10px] text-stone-400 block">{gift.priceNote}</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleTogglePublished(gift)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors tap-target ${
                            gift.isPublished
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-stone-100 text-stone-500 border border-stone-200'
                          }`}
                        >
                          {gift.isPublished ? (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span>Live</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>Hidden</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleFeatured(gift)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors tap-target ${
                            gift.isFeatured
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-stone-50 text-stone-400 border border-stone-200'
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{gift.isFeatured ? 'Featured' : 'Regular'}</span>
                        </button>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(gift)}
                            className="p-2 rounded-lg text-stone-600 hover:text-blush-600 hover:bg-blush-50 transition-colors tap-target"
                            title="Edit Gift"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingGift(gift)}
                            className="p-2 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors tap-target"
                            title="Delete Gift"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Gift Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-elevated my-8 border border-stone-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <h2 className="font-serif text-xl font-bold text-stone-900">
                {editingGift ? 'Edit Gift' : 'Add New Gift'}
              </h2>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="mt-6 space-y-5">
              {/* Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Royal Velvet Anniversary Hamper"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:border-blush-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:border-blush-500 focus:outline-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price & Price Note */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Price (INR) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="e.g. 2999"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:border-blush-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Price Note
                  </label>
                  <input
                    type="text"
                    value={formData.priceNote}
                    onChange={(e) => setFormData({ ...formData, priceNote: e.target.value })}
                    placeholder="e.g. starts from, inclusive of taxes"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:border-blush-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Short & Full Description */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Short Description
                </label>
                <input
                  type="text"
                  maxLength={300}
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  placeholder="One sentence teaser for catalogs and cards"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:border-blush-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Full Description *
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed breakdown of the creation, aesthetic vibe, materials..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:border-blush-500 focus:outline-none"
                />
              </div>

              {/* Multi-Image Upload & Preview */}
              <div className="space-y-3 p-4 rounded-2xl bg-stone-50 border border-stone-200/80">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-800 block">
                      Product Images (Min 1, Max 6) *
                    </span>
                    <span className="text-[11px] text-stone-500">
                      JPEG, PNG, or WebP up to 5MB each. First image will be primary.
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-stone-600 bg-white px-2.5 py-1 rounded-lg border border-stone-200">
                    {formData.images.length}/6
                  </span>
                </div>

                {uploadError && (
                  <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* Upload Button */}
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="gift-image-upload-input"
                    disabled={isUploading || formData.images.length >= 6}
                  />
                  <label
                    htmlFor="gift-image-upload-input"
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-xs ${
                      formData.images.length >= 6 || isUploading
                        ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                        : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-blush-600" />
                        <span>Uploading to Cloudinary...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 text-blush-600" />
                        <span>Upload Images</span>
                      </>
                    )}
                  </label>

                  {/* Manual URL input fallback */}
                  <div className="flex-1 flex gap-1 min-w-[220px]">
                    <input
                      type="url"
                      value={manualImageUrl}
                      onChange={(e) => setManualImageUrl(e.target.value)}
                      placeholder="Or paste image URL directly..."
                      className="w-full px-3 py-1.5 rounded-lg border border-stone-200 text-xs bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddManualUrl}
                      className="px-3 py-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-xs font-semibold text-stone-700"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Previews */}
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 pt-2">
                    {formData.images.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-square rounded-xl overflow-hidden bg-stone-200 border border-stone-300 group"
                      >
                        <img
                          src={img.url}
                          alt={`Upload preview ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {idx === 0 && (
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-stone-900/80 text-white text-[9px] font-bold">
                            Primary
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 text-white opacity-90 hover:opacity-100 shadow-xs"
                          title="Remove image"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Lists: Includes, Customization Options, Occasions */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    What's Included (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.includes}
                    onChange={(e) => setFormData({ ...formData, includes: e.target.value })}
                    placeholder="e.g. Scented Candle, Personalized Wooden Frame, Ferrero Rocher Box"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:border-blush-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Customization Options (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.customizationOptions}
                    onChange={(e) =>
                      setFormData({ ...formData, customizationOptions: e.target.value })
                    }
                    placeholder="e.g. Inscription text, Color palette, Velvet box color"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:border-blush-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Occasions (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.occasions}
                    onChange={(e) => setFormData({ ...formData, occasions: e.target.value })}
                    placeholder="e.g. Birthday, Anniversary, Wedding, Engagement"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:border-blush-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Delivery & Timeline Info
                  </label>
                  <input
                    type="text"
                    value={formData.deliveryInfo}
                    onChange={(e) => setFormData({ ...formData, deliveryInfo: e.target.value })}
                    placeholder="e.g. Standard delivery in 3-5 business days across India."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:border-blush-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Toggles: isPublished & isFeatured */}
              <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-stone-100">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    className="w-4 h-4 rounded text-blush-600 focus:ring-blush-500 border-stone-300"
                  />
                  <span className="text-xs font-semibold text-stone-800">
                    Publish immediately (visible in catalog)
                  </span>
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="w-4 h-4 rounded text-blush-600 focus:ring-blush-500 border-stone-300"
                  />
                  <span className="text-xs font-semibold text-stone-800">
                    Mark as Featured (show on home page)
                  </span>
                </label>
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 font-semibold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting || isUploading}
                  className="px-6 py-2.5 rounded-xl bg-blush-600 hover:bg-blush-700 text-white font-semibold text-sm shadow-soft transition-colors flex items-center gap-2 disabled:opacity-60"
                >
                  {formSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingGift ? 'Update Gift' : 'Create Gift'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingGift && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-elevated border border-stone-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Delete Gift Creation?
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-stone-600 leading-relaxed">
                Are you sure you want to permanently delete{' '}
                <span className="font-semibold text-stone-900">"{deletingGift.title}"</span>? This will also remove any images stored in Cloudinary. This action cannot be undone.
              </p>
            </div>
            <div className="pt-3 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={deleteSubmitting}
                onClick={() => setDeletingGift(null)}
                className="px-4 py-2 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteSubmitting}
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold shadow-soft transition-colors flex items-center gap-2"
              >
                {deleteSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Delete Gift</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
