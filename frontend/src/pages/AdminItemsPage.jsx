import React, { useState, useEffect, useRef } from 'react';
import {
  Package,
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
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  Clock,
  Tag,
  Sliders,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import { api, ApiError } from '../lib/api';

const CATEGORIES = ['Bouquet', 'Hamper', 'Frame', 'Engraved', 'Other'];
const CUSTOMIZATION_TYPES = ['text', 'select', 'boolean', 'file'];

export function AdminItemsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Delete Modal
  const [deletingItem, setDeletingItem] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Toast notification
  const [toast, setToast] = useState(null);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  // Form Data
  const [formData, setFormData] = useState({
    title: '',
    category: 'Bouquet',
    startingPrice: '',
    description: '',
    prepTimeDays: 2,
    images: [],
    customizationOptions: [],
    occasionTags: '',
    isFeatured: false,
    isVisible: true,
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/api/admin/items');
      setItems(res.items || []);
    } catch (err) {
      setError(err.message || 'Failed to load catalogue items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormError(null);
    setUploadError(null);
    setFormData({
      title: '',
      category: 'Bouquet',
      startingPrice: '',
      description: '',
      prepTimeDays: 2,
      images: [],
      customizationOptions: [{ label: 'Personalized Card Note', type: 'text' }],
      occasionTags: 'Birthday, Anniversary',
      isFeatured: false,
      isVisible: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormError(null);
    setUploadError(null);
    setFormData({
      title: item.title || '',
      category: item.category || 'Bouquet',
      startingPrice: item.startingPrice !== null && item.startingPrice !== undefined ? String(item.startingPrice) : '',
      description: item.description || '',
      prepTimeDays: item.prepTimeDays !== undefined ? item.prepTimeDays : 2,
      images: Array.isArray(item.images) ? [...item.images] : [],
      customizationOptions: Array.isArray(item.customizationOptions)
        ? item.customizationOptions.map((opt) => (typeof opt === 'string' ? { label: opt, type: 'text' } : opt))
        : [],
      occasionTags: Array.isArray(item.occasionTags) ? item.occasionTags.join(', ') : '',
      isFeatured: !!item.isFeatured,
      isVisible: item.isVisible !== undefined ? !!item.isVisible : true,
    });
    setIsModalOpen(true);
  };

  // Toggle Visibility
  const handleToggleVisible = async (item) => {
    const nextState = !item.isVisible;
    try {
      await api.patch(`/api/admin/items/${item.id || item._id}`, { isVisible: nextState });
      setItems((prev) =>
        prev.map((i) => ((i.id || i._id) === (item.id || item._id) ? { ...i, isVisible: nextState } : i))
      );
      showToast(`Item is now ${nextState ? 'visible to customers' : 'hidden from public view'}`);
    } catch (err) {
      showToast(err.message || 'Failed to update visibility', 'error');
    }
  };

  // Toggle Featured
  const handleToggleFeatured = async (item) => {
    const nextState = !item.isFeatured;
    try {
      await api.patch(`/api/admin/items/${item.id || item._id}`, { isFeatured: nextState });
      setItems((prev) =>
        prev.map((i) => ((i.id || i._id) === (item.id || item._id) ? { ...i, isFeatured: nextState } : i))
      );
      showToast(`Item ${nextState ? 'featured on home page' : 'removed from featured list'}`);
    } catch (err) {
      showToast(err.message || 'Failed to update featured flag', 'error');
    }
  };

  // Upload handler for multiple photos
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (formData.images.length + files.length > 6) {
      setUploadError(`You can have at most 6 images per item. Currently have ${formData.images.length}.`);
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const uploadedImages = [];
      for (const file of files) {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          throw new Error('Only JPEG, PNG, and WebP images are permitted.');
        }
        if (file.size > 5 * 1024 * 1024) {
          throw new Error('Each image file must not exceed 5 MB.');
        }

        const data = new FormData();
        data.append('image', file);
        const res = await api.post('/api/admin/items/upload', data);
        uploadedImages.push({
          url: res.url,
          publicId: res.publicId || '',
        });
      }

      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedImages],
      }));
      showToast(`Successfully uploaded ${uploadedImages.length} image(s)`);
    } catch (err) {
      setUploadError(err.message || 'Image upload failed.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };


  const handleRemoveImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleMoveImage = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= formData.images.length) return;
    setFormData((prev) => {
      const copy = [...prev.images];
      const item = copy.splice(fromIndex, 1)[0];
      copy.splice(toIndex, 0, item);
      return { ...prev, images: copy };
    });
  };

  // Dynamic customization options
  const handleAddCustomization = () => {
    setFormData((prev) => ({
      ...prev,
      customizationOptions: [...prev.customizationOptions, { label: '', type: 'text' }],
    }));
  };

  const handleUpdateCustomization = (index, field, value) => {
    setFormData((prev) => {
      const copy = [...prev.customizationOptions];
      copy[index] = { ...copy[index], [field]: value };
      return { ...prev, customizationOptions: copy };
    });
  };

  const handleRemoveCustomization = (index) => {
    setFormData((prev) => ({
      ...prev,
      customizationOptions: prev.customizationOptions.filter((_, i) => i !== index),
    }));
  };

  // Form Submission
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError(null);

    // Client-side validations
    if (!formData.title.trim() || formData.title.trim().length < 2) {
      setFormError('Title must be at least 2 characters.');
      return;
    }
    if (!formData.description.trim()) {
      setFormError('Please enter a description for this item.');
      return;
    }
    if (formData.images.length === 0) {
      setFormError('Please upload or add at least 1 image.');
      return;
    }
    if (formData.images.length > 6) {
      setFormError('At most 6 images allowed.');
      return;
    }

    const priceNum = formData.startingPrice !== '' && formData.startingPrice !== null
      ? parseFloat(formData.startingPrice)
      : null;
    if (priceNum !== null && (isNaN(priceNum) || priceNum < 0)) {
      setFormError('Starting price must be a positive number or left blank for Price on Request.');
      return;
    }

    const prepDays = parseInt(formData.prepTimeDays, 10);
    if (isNaN(prepDays) || prepDays < 0) {
      setFormError('Preparation time must be a non-negative integer.');
      return;
    }

    const tagsArray = formData.occasionTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const validCustomizations = formData.customizationOptions
      .filter((c) => c.label.trim())
      .map((c) => ({ label: c.label.trim(), type: c.type }));

    const payload = {
      title: formData.title.trim(),
      category: formData.category,
      startingPrice: priceNum,
      description: formData.description.trim(),
      prepTimeDays: prepDays,
      images: formData.images,
      customizationOptions: validCustomizations,
      occasionTags: tagsArray,
      isFeatured: formData.isFeatured,
      isVisible: formData.isVisible,
    };

    setFormSubmitting(true);
    try {
      if (editingItem) {
        const res = await api.put(`/api/admin/items/${editingItem.id || editingItem._id}`, payload);
        setItems((prev) =>
          prev.map((i) => ((i.id || i._id) === (editingItem.id || editingItem._id) ? res.item : i))
        );
        showToast('Item updated successfully!');
      } else {
        const res = await api.post('/api/admin/items', payload);
        setItems((prev) => [res.item, ...prev]);
        showToast('New item created successfully!');
      }
      setIsModalOpen(false);
    } catch (err) {
      if (err instanceof ApiError && err.details?.length) {
        setFormError(err.details.map((d) => d.message).join(' | '));
      } else {
        setFormError(err.message || 'Failed to save item.');
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete Action
  const handleDeleteItem = async () => {
    if (!deletingItem) return;
    setDeleteSubmitting(true);
    setDeleteError(null);

    try {
      await api.delete(`/api/admin/items/${deletingItem.id || deletingItem._id}`);
      setItems((prev) => prev.filter((i) => (i.id || i._id) !== (deletingItem.id || deletingItem._id)));
      showToast('Item deleted successfully.');
      setDeletingItem(null);
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete item.');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchSearch =
      !searchQuery.trim() ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCategory && matchSearch;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-elevated text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in slide-in-from-bottom-3 duration-200 ${
            toast.type === 'error'
              ? 'bg-rose-600 text-white'
              : 'bg-stone-900 text-gold-300 border border-gold-400/30'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gold-700">
            <Package className="w-3.5 h-3.5" />
            <span>Catalogue Management</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight mt-0.5">
            Bespoke Gifting Items
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Manage product images, customization parameters, pricing and catalogue visibility.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-blush-600 hover:bg-blush-700 text-white text-xs sm:text-sm font-semibold shadow-soft hover:shadow-elevated transition-all tap-target"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Creation</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items by title or category..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-cream-50/50 border border-stone-200 text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-blush-500 focus:ring-1 focus:ring-blush-300 transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['All', ...CATEGORIES].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content State: Loading, Error, Empty, or Table */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center shadow-soft">
          <Loader2 className="w-8 h-8 animate-spin text-blush-600 mx-auto" />
          <p className="mt-3 text-xs text-stone-500 font-medium">Loading items catalogue...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 text-center text-rose-800">
          <AlertCircle className="w-6 h-6 text-rose-600 mx-auto mb-2" />
          <p className="text-sm font-semibold">{error}</p>
          <button
            onClick={fetchItems}
            className="mt-3 px-4 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700"
          >
            Retry Loading
          </button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200/80 p-12 text-center shadow-soft space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-cream-100 text-stone-400 flex items-center justify-center mx-auto">
            <Package className="w-6 h-6 text-stone-400" />
          </div>
          <h3 className="font-serif text-lg font-bold text-stone-900">No Items Found</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            {searchQuery || selectedCategory !== 'All'
              ? 'No items match your active filters. Try resetting the search or category.'
              : 'Your catalogue is currently empty. Click "Add New Creation" above to get started.'}
          </p>
        </div>
      ) : (
        /* Items Table */
        <div className="bg-white rounded-3xl border border-stone-200/90 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-cream-50/80 text-stone-500 border-b border-stone-200/70 text-[11px] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Item</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Starting Price</th>
                  <th className="py-3.5 px-4 text-center">Featured</th>
                  <th className="py-3.5 px-4 text-center">Visible</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
                {filteredItems.map((item) => {
                  const itemId = item.id || item._id;
                  const thumb = item.images?.[0]?.url || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=400&q=80';
                  const imgCount = item.images?.length || 0;

                  return (
                    <tr key={itemId} className="hover:bg-cream-50/40 transition-colors">
                      {/* Thumbnail & Title */}
                      <td className="py-3 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200/70 shadow-2xs">
                            <img
                              src={thumb}
                              alt={item.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            {imgCount > 1 && (
                              <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded-sm bg-black/60 text-[9px] text-white font-bold">
                                {imgCount}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-stone-900 truncate max-w-[200px] sm:max-w-xs">
                              {item.title}
                            </div>
                            <div className="text-[11px] text-stone-400 flex items-center gap-2 mt-0.5">
                              <span>slug: {item.slug}</span>
                              <span>•</span>
                              <span>{item.prepTimeDays}d prep</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blush-50 text-blush-700 border border-blush-100">
                          {item.category}
                        </span>
                      </td>

                      {/* Starting Price */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {item.startingPrice !== null && item.startingPrice !== undefined ? (
                          <span className="font-bold text-stone-900">
                            ₹{Number(item.startingPrice).toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="italic text-stone-400 text-xs">
                            Price on request
                          </span>
                        )}
                      </td>

                      {/* Featured Toggle */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleFeatured(item)}
                          title={item.isFeatured ? 'Click to unfeature' : 'Click to feature on home'}
                          className={`p-1.5 rounded-xl transition-colors ${
                            item.isFeatured
                              ? 'bg-gold-100 text-gold-700 hover:bg-gold-200'
                              : 'text-stone-300 hover:text-stone-500 hover:bg-stone-100'
                          }`}
                        >
                          <Sparkles className="w-4 h-4 fill-current" />
                        </button>
                      </td>

                      {/* Visible Toggle */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleVisible(item)}
                          title={item.isVisible ? 'Visible to public (click to hide)' : 'Hidden (click to show)'}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                            item.isVisible
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                              : 'bg-stone-100 text-stone-500 hover:bg-stone-200 border border-stone-200'
                          }`}
                        >
                          {item.isVisible ? (
                            <>
                              <Eye className="w-3 h-3" />
                              <span>Live</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3" />
                              <span>Hidden</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 sm:px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            className="p-2 rounded-xl text-stone-600 hover:text-blush-700 hover:bg-blush-50 transition-colors"
                            title="Edit Item"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteError(null);
                              setDeletingItem(item);
                            }}
                            className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Item"
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

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
            </div>

            <div>
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Delete "{deletingItem.title}"?
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 mt-1 leading-relaxed">
                Are you sure you want to delete this item? If any existing customer orders reference this item, deletion will be blocked to protect historical order records (you can hide it instead).
              </p>
            </div>

            {deleteError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">{deleteError}</div>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={deleteSubmitting}
                onClick={() => setDeletingItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteSubmitting}
                onClick={handleDeleteItem}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors flex items-center gap-1.5 shadow-soft"
              >
                {deleteSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Yes, Delete Item</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Item Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 my-8 space-y-6 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
                  {editingItem ? 'Edit Catalogue Item' : 'Create New Creation'}
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  Configure visual assets, options, price points, and tags.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">{formError}</div>
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-6">
              {/* Row 1: Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
                    Item Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Royal Blush Velvet Celebration Hamper"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-blush-500 focus:ring-1 focus:ring-blush-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-blush-500 focus:ring-1 focus:ring-blush-200 bg-white"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Starting Price & Prep Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
                    Starting Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.startingPrice}
                    onChange={(e) => setFormData({ ...formData, startingPrice: e.target.value })}
                    placeholder="Leave empty for 'Price on Request'"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-blush-500 focus:ring-1 focus:ring-blush-200"
                  />
                  <p className="text-[11px] text-stone-400">
                    Leave blank to show "Price on request" on the catalogue.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
                    Prep Time (Days)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={formData.prepTimeDays}
                    onChange={(e) => setFormData({ ...formData, prepTimeDays: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-blush-500 focus:ring-1 focus:ring-blush-200"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
                  Detailed Description *
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe flowers, materials, dimensions, and craft details..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-blush-500 focus:ring-1 focus:ring-blush-200"
                />
              </div>

              {/* Multi-Image Upload & Management */}
              <div className="space-y-3 pt-2 border-t border-stone-100">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
                      Product Images ({formData.images.length}/6) *
                    </label>
                    <p className="text-[11px] text-stone-400">
                      Upload up to 6 photos (JPG, PNG, WebP &le; 5MB). The first image will be the primary cover.
                    </p>
                  </div>

                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={isUploading || formData.images.length >= 6}
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blush-50 hover:bg-blush-100 text-blush-700 text-xs font-semibold border border-blush-200 transition-colors disabled:opacity-50"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Photos</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {uploadError && (
                  <div className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                    {uploadError}
                  </div>
                )}


                {/* Images Preview & Reorder Grid */}
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                    {formData.images.map((img, idx) => (
                      <div
                        key={idx}
                        className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 shadow-2xs"
                      >
                        <img
                          src={img.url}
                          alt={`Asset ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {idx === 0 && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-stone-900/80 text-white text-[10px] font-bold">
                            Cover
                          </span>
                        )}

                        {/* Image overlay actions */}
                        <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={() => handleMoveImage(idx, idx - 1)}
                              className="p-1 rounded-lg bg-white/90 text-stone-800 hover:bg-white"
                              title="Move Earlier"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {idx < formData.images.length - 1 && (
                            <button
                              type="button"
                              onClick={() => handleMoveImage(idx, idx + 1)}
                              className="p-1 rounded-lg bg-white/90 text-stone-800 hover:bg-white"
                              title="Move Later"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="p-1 rounded-lg bg-rose-600 text-white hover:bg-rose-700"
                            title="Remove Photo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Customization Options Dynamic Rows */}
              <div className="space-y-3 pt-2 border-t border-stone-100">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
                      Customization Prompts for Customers
                    </label>
                    <p className="text-[11px] text-stone-400">
                      Options the customer can customize when submitting an order enquiry.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCustomization}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cream-100 hover:bg-cream-200 text-stone-700 text-xs font-semibold transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Field</span>
                  </button>
                </div>

                {formData.customizationOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={opt.label}
                      onChange={(e) => handleUpdateCustomization(idx, 'label', e.target.value)}
                      placeholder="e.g. Inscription Name, Velvet Ribbon Hue..."
                      className="flex-1 px-3 py-1.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-blush-400"
                    />
                    <select
                      value={opt.type}
                      onChange={(e) => handleUpdateCustomization(idx, 'type', e.target.value)}
                      className="w-28 px-2 py-1.5 rounded-xl border border-stone-200 text-xs bg-white focus:outline-none focus:border-blush-400"
                    >
                      {CUSTOMIZATION_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomization(idx)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Occasion Tags */}
              <div className="space-y-1.5 pt-2 border-t border-stone-100">
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
                  Occasion Tags (Comma Separated)
                </label>
                <input
                  type="text"
                  value={formData.occasionTags}
                  onChange={(e) => setFormData({ ...formData, occasionTags: e.target.value })}
                  placeholder="e.g. Birthday, Anniversary, Wedding, Diwali"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-blush-500"
                />
              </div>

              {/* Switches: Featured & Visible */}
              <div className="pt-2 border-t border-stone-100 flex flex-wrap gap-6">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.isVisible}
                    onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
                    className="w-4 h-4 rounded text-blush-600 focus:ring-blush-400"
                  />
                  <span className="text-xs font-semibold text-stone-800">
                    Visible on Public Storefront
                  </span>
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="w-4 h-4 rounded text-gold-600 focus:ring-gold-400"
                  />
                  <span className="text-xs font-semibold text-stone-800">
                    Feature in Hero / Featured Showcase
                  </span>
                </label>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={formSubmitting || isUploading}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting || isUploading}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-blush-600 hover:bg-blush-700 transition-all shadow-soft flex items-center gap-2 disabled:opacity-50"
                >
                  {formSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Item...</span>
                    </>
                  ) : (
                    <span>{editingItem ? 'Save Changes' : 'Create Item'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
