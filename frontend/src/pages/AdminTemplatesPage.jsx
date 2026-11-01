import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Film,
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
  ExternalLink,
  Play,
  Clock,
  DollarSign,
  Layers,
  Music,
  LayoutGrid,
  List,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { api, ApiError } from '../lib/api';

const TEMPLATE_CATEGORIES = [
  'Wedding',
  'Engagement',
  'Birthday',
  'Nikah / Mehendi',
  'Baby Shower',
  'Other',
];

const ASPECT_RATIOS = ['9:16', '16:9', '1:1'];

const DEFAULT_INCLUSIONS = [
  'Full HD 1080p Video File',
  'Custom Music / Audio Sync',
  'Up to 2 Rounds of Minor Text Edits',
  'Digital Delivery via Cloud Drive Link',
];

const isHttpUrl = (val) => {
  if (typeof val !== 'string') return false;
  try {
    const parsed = new URL(val);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export function AdminTemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Delete Modal State
  const [deletingTemplate, setDeletingTemplate] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Toast notification
  const [toast, setToast] = useState(null);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  // Form Data
  const [formData, setFormData] = useState({
    title: '',
    category: 'Wedding',
    description: '',
    previewVideoUrl: '',
    thumbnailUrl: '',
    basePrice: '',
    deliveryDays: 2,
    whatsIncluded: DEFAULT_INCLUSIONS,
    aspectRatio: '9:16',
    sampleAudioTitle: '',
    isFeatured: false,
    isActive: true,
    sortOrder: 0,
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/api/admin/templates');
      setTemplates(res.templates || []);
    } catch (err) {
      setError(err.message || 'Failed to load video templates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleOpenAddModal = () => {
    setEditingTemplate(null);
    setFormError(null);
    setUploadError(null);
    setUploadProgress(0);
    setFormData({
      title: '',
      category: 'Wedding',
      description: '',
      previewVideoUrl: '',
      thumbnailUrl: '',
      basePrice: '',
      deliveryDays: 2,
      whatsIncluded: [...DEFAULT_INCLUSIONS],
      aspectRatio: '9:16',
      sampleAudioTitle: '',
      isFeatured: false,
      isActive: true,
      sortOrder: 0,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (tpl) => {
    setEditingTemplate(tpl);
    setFormError(null);
    setUploadError(null);
    setUploadProgress(0);
    setFormData({
      title: tpl.title || '',
      category: tpl.category || 'Wedding',
      description: tpl.description || '',
      previewVideoUrl: tpl.previewVideoUrl || '',
      thumbnailUrl: tpl.thumbnailUrl || '',
      basePrice: tpl.basePrice !== null && tpl.basePrice !== undefined ? String(tpl.basePrice) : '',
      deliveryDays: tpl.deliveryDays || 2,
      whatsIncluded: Array.isArray(tpl.whatsIncluded) && tpl.whatsIncluded.length > 0
        ? [...tpl.whatsIncluded]
        : [...DEFAULT_INCLUSIONS],
      aspectRatio: tpl.aspectRatio || '9:16',
      sampleAudioTitle: tpl.sampleAudioTitle || '',
      isFeatured: !!tpl.isFeatured,
      isActive: tpl.isActive !== undefined ? !!tpl.isActive : true,
      sortOrder: tpl.sortOrder || 0,
    });
    setIsModalOpen(true);
  };

  // Video File Upload handler with Progress
  const handleVideoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'video/mp4') {
      setUploadError('Only MP4 videos (.mp4) are supported.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setUploadError('Video file size exceeds 20MB limit.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    setUploadProgress(0);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/admin/templates/upload-video');
    xhr.withCredentials = true;
    xhr.setRequestHeader('X-Requested-With', 'fouzas-web');

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percent);
      }
    };

    xhr.onload = () => {
      setIsUploading(false);
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          setFormData((prev) => ({
            ...prev,
            previewVideoUrl: data.previewVideoUrl,
            thumbnailUrl: data.thumbnailUrl || prev.thumbnailUrl,
          }));
          showToast('MP4 video uploaded & poster thumbnail generated!');
        } else {
          setUploadError(data.error || 'Video upload failed.');
        }
      } catch (parseErr) {
        setUploadError('Failed to parse upload server response.');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    xhr.onerror = () => {
      setIsUploading(false);
      setUploadError('Network error during video upload. Please check your connection.');
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const uploadPayload = new FormData();
    uploadPayload.append('video', file);
    xhr.send(uploadPayload);
  };

  // Inclusions item handlers
  const handleAddInclusion = () => {
    if (formData.whatsIncluded.length >= 15) return;
    setFormData((prev) => ({
      ...prev,
      whatsIncluded: [...prev.whatsIncluded, ''],
    }));
  };

  const handleUpdateInclusion = (index, val) => {
    setFormData((prev) => {
      const copy = [...prev.whatsIncluded];
      copy[index] = val;
      return { ...prev, whatsIncluded: copy };
    });
  };

  const handleRemoveInclusion = (index) => {
    setFormData((prev) => ({
      ...prev,
      whatsIncluded: prev.whatsIncluded.filter((_, i) => i !== index),
    }));
  };

  // Toggle Visibility / Active State
  const handleToggleActive = async (template) => {
    const templateId = template.id || template._id;
    const nextState = !template.isActive;
    try {
      const res = await api.patch(`/api/admin/templates/${templateId}`, {
        isActive: nextState,
      });
      setTemplates((prev) =>
        prev.map((t) => ((t.id || t._id) === templateId ? res.template : t))
      );
      showToast(
        `Template set to ${nextState ? 'Active / Visible' : 'Hidden from public'}.`
      );
    } catch (err) {
      showToast(err.message || 'Failed to update template visibility.', 'error');
    }
  };

  // Form Submit (Create / Edit)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError(null);

    // Validations
    if (!formData.title.trim() || formData.title.trim().length < 2) {
      setFormError('Title must be at least 2 characters.');
      return;
    }
    if (!formData.description.trim() || formData.description.trim().length < 5) {
      setFormError('Description must be at least 5 characters.');
      return;
    }
    if (!formData.previewVideoUrl.trim() || !isHttpUrl(formData.previewVideoUrl.trim())) {
      setFormError('A valid HTTP or HTTPS Preview Video URL is required.');
      return;
    }
    if (!formData.thumbnailUrl.trim() || !isHttpUrl(formData.thumbnailUrl.trim())) {
      setFormError('A valid HTTP or HTTPS Thumbnail Image URL is required.');
      return;
    }

    const priceNum = parseFloat(formData.basePrice);
    if (isNaN(priceNum) || priceNum < 0) {
      setFormError('Base price must be a valid non-negative number.');
      return;
    }

    const daysNum = parseInt(formData.deliveryDays, 10);
    if (isNaN(daysNum) || daysNum < 1 || daysNum > 30) {
      setFormError('Delivery days must be between 1 and 30 days.');
      return;
    }

    const cleanInclusions = formData.whatsIncluded
      .map((item) => item.trim())
      .filter(Boolean);

    const payload = {
      title: formData.title.trim(),
      category: formData.category,
      description: formData.description.trim(),
      previewVideoUrl: formData.previewVideoUrl.trim(),
      thumbnailUrl: formData.thumbnailUrl.trim(),
      basePrice: priceNum,
      deliveryDays: daysNum,
      whatsIncluded: cleanInclusions.length > 0 ? cleanInclusions : DEFAULT_INCLUSIONS,
      aspectRatio: formData.aspectRatio,
      sampleAudioTitle: formData.sampleAudioTitle.trim(),
      isFeatured: formData.isFeatured,
      isActive: formData.isActive,
      sortOrder: parseInt(formData.sortOrder, 10) || 0,
    };

    setFormSubmitting(true);
    try {
      if (editingTemplate) {
        const tId = editingTemplate.id || editingTemplate._id;
        const res = await api.patch(`/api/admin/templates/${tId}`, payload);
        setTemplates((prev) =>
          prev.map((t) => ((t.id || t._id) === tId ? res.template : t))
        );
        showToast('Video template updated successfully!');
      } else {
        const res = await api.post('/api/admin/templates', payload);
        setTemplates((prev) => [res.template, ...prev]);
        showToast('New video template created successfully!');
      }
      setIsModalOpen(false);
    } catch (err) {
      if (err instanceof ApiError && err.details?.length) {
        setFormError(err.details.map((d) => d.message).join(' | '));
      } else {
        setFormError(err.message || 'Failed to save video template.');
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete Action
  const handleDeleteTemplate = async () => {
    if (!deletingTemplate) return;
    const tId = deletingTemplate.id || deletingTemplate._id;
    setDeleteSubmitting(true);
    setDeleteError(null);

    try {
      const res = await api.delete(`/api/admin/templates/${tId}`);
      if (res.archived) {
        // Soft-archived because orders use it
        setTemplates((prev) =>
          prev.map((t) => ((t.id || t._id) === tId ? { ...t, isActive: false } : t))
        );
        showToast(
          'Hidden because orders use it (archived instead of deleted to protect order history).',
          'info'
        );
      } else {
        // Permanently deleted
        setTemplates((prev) => prev.filter((t) => (t.id || t._id) !== tId));
        showToast('Template permanently deleted.');
      }
      setDeletingTemplate(null);
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete template.');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  // Filtered Templates
  const filteredTemplates = templates.filter((tpl) => {
    const matchesCategory =
      selectedCategory === 'All' ||
      tpl.category?.toLowerCase() === selectedCategory.toLowerCase();

    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      tpl.title?.toLowerCase().includes(q) ||
      tpl.description?.toLowerCase().includes(q) ||
      tpl.category?.toLowerCase().includes(q);

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-elevated text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in slide-in-from-bottom-3 duration-200 ${
            toast.type === 'error'
              ? 'bg-rose-600 text-white'
              : toast.type === 'info'
              ? 'bg-amber-600 text-white'
              : 'bg-stone-900 text-gold-300 border border-gold-400/30'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gold-700">
            <Film className="w-3.5 h-3.5" />
            <span>Digital Video Hub</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight mt-0.5">
            Video Invitation Templates
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Manage bespoke animated invitation templates, MP4 video uploads, pricing, and showcase visibility.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-blush-600 hover:bg-blush-700 text-white text-xs sm:text-sm font-semibold shadow-soft hover:shadow-elevated transition-all tap-target self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Template</span>
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
              placeholder="Search templates by title, description or category..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-cream-50/50 border border-stone-200 text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-blush-500 focus:ring-1 focus:ring-blush-300 transition-all"
            />
          </div>

          {/* View mode toggle (Table / Grid) */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'table' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-800'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'grid' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-800'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {['All', ...TEMPLATE_CATEGORIES].map((cat) => (
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

      {/* Content State: Loading, Error, Empty, Table or Grid */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center shadow-soft">
          <Loader2 className="w-8 h-8 animate-spin text-blush-600 mx-auto" />
          <p className="mt-3 text-xs text-stone-500 font-medium">Loading video templates...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 text-center text-rose-800">
          <AlertCircle className="w-6 h-6 text-rose-600 mx-auto mb-2" />
          <p className="text-sm font-semibold">{error}</p>
          <button
            onClick={fetchTemplates}
            className="mt-3 px-4 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700"
          >
            Retry Loading
          </button>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200/80 p-12 text-center shadow-soft space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-cream-100 text-stone-400 flex items-center justify-center mx-auto">
            <Film className="w-6 h-6 text-stone-400" />
          </div>
          <h3 className="font-serif text-lg font-bold text-stone-900">No Templates Found</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            {searchQuery || selectedCategory !== 'All'
              ? 'No templates match your active filters. Try resetting the search or category.'
              : 'No video templates in the library yet. Click "Add New Template" above to get started.'}
          </p>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white rounded-3xl border border-stone-200/90 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-cream-50/80 text-stone-500 border-b border-stone-200/70 text-[11px] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Template</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Base Price</th>
                  <th className="py-3.5 px-4">Aspect</th>
                  <th className="py-3.5 px-4">Delivery</th>
                  <th className="py-3.5 px-4 text-center">Featured</th>
                  <th className="py-3.5 px-4 text-center">Visible</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
                {filteredTemplates.map((tpl) => {
                  const tId = tpl.id || tpl._id;
                  const isSample =
                    tpl.previewVideoUrl?.includes('commondatastorage.googleapis.com') ||
                    tpl.previewVideoUrl?.includes('BigBuckBunny') ||
                    tpl.previewVideoUrl?.includes('sample');

                  return (
                    <tr key={tId} className="hover:bg-cream-50/40 transition-colors">
                      {/* Thumbnail & Title */}
                      <td className="py-3 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-14 rounded-xl overflow-hidden bg-stone-900 shrink-0 border border-stone-200 shadow-2xs group">
                            <img
                              src={
                                tpl.thumbnailUrl ||
                                'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=400&q=80'
                              }
                              alt={tpl.title}
                              className="w-full h-full object-cover opacity-90"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white">
                              <Play className="w-4 h-4 fill-white" />
                            </div>
                          </div>
                          <div className="min-w-0 max-w-[200px] sm:max-w-xs">
                            <div className="font-semibold text-stone-900 truncate">{tpl.title}</div>
                            {tpl.sampleAudioTitle && (
                              <div className="text-[11px] text-stone-400 flex items-center gap-1 truncate mt-0.5">
                                <Music className="w-3 h-3 text-stone-400 shrink-0" />
                                <span className="truncate">{tpl.sampleAudioTitle}</span>
                              </div>
                            )}
                            {isSample && (
                              <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/70">
                                Sample Video
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-cream-100 text-stone-700 border border-stone-200/60">
                          {tpl.category}
                        </span>
                      </td>

                      {/* Base Price */}
                      <td className="py-3 px-4 whitespace-nowrap font-serif font-bold text-stone-900">
                        ₹{Number(tpl.basePrice || 0).toLocaleString('en-IN')}
                      </td>

                      {/* Aspect Ratio */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-stone-500">
                        {tpl.aspectRatio || '9:16'}
                      </td>

                      {/* Delivery Days */}
                      <td className="py-3 px-4 whitespace-nowrap text-stone-600 text-xs">
                        ~{tpl.deliveryDays || 2} days
                      </td>

                      {/* Featured */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {tpl.isFeatured ? (
                          <span
                            title="Featured on Showcase"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-gold-700 bg-gold-50 border border-gold-200 px-2 py-0.5 rounded-full"
                          >
                            <Sparkles className="w-3 h-3 text-gold-600" />
                            <span>Featured</span>
                          </span>
                        ) : (
                          <span className="text-stone-300 text-xs">—</span>
                        )}
                      </td>

                      {/* Visible Toggle */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(tpl)}
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all ${
                            tpl.isActive
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-stone-100 text-stone-500 border-stone-200 hover:bg-stone-200'
                          }`}
                          title={tpl.isActive ? 'Click to hide from store' : 'Click to make active'}
                        >
                          {tpl.isActive ? (
                            <>
                              <Eye className="w-3 h-3 text-emerald-600" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3 text-stone-400" />
                              <span>Hidden</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 sm:px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/templates/${tpl.slug || tId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                            title="Preview Public Page"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(tpl)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-blush-700 hover:bg-blush-50 transition-colors"
                            title="Edit Template"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteError(null);
                              setDeletingTemplate(tpl);
                            }}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete or Hide Template"
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
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredTemplates.map((tpl) => {
            const tId = tpl.id || tpl._id;
            const isSample =
              tpl.previewVideoUrl?.includes('commondatastorage.googleapis.com') ||
              tpl.previewVideoUrl?.includes('BigBuckBunny') ||
              tpl.previewVideoUrl?.includes('sample');

            return (
              <div
                key={tId}
                className="bg-white rounded-3xl border border-stone-200/90 shadow-2xs overflow-hidden flex flex-col group hover:shadow-soft transition-all"
              >
                {/* Poster / Video Header */}
                <div className="relative aspect-[9/12] bg-stone-900 overflow-hidden">
                  <img
                    src={
                      tpl.thumbnailUrl ||
                      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=400&q=80'
                    }
                    alt={tpl.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-stone-950/30" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/90 backdrop-blur-md text-stone-800">
                      {tpl.category}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(tpl)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md transition-colors ${
                        tpl.isActive
                          ? 'bg-emerald-500/90 text-white border-emerald-400'
                          : 'bg-stone-800/80 text-stone-300 border-stone-600'
                      }`}
                    >
                      {tpl.isActive ? 'Active' : 'Hidden'}
                    </button>
                  </div>

                  {/* Bottom Video details */}
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <div className="flex items-center justify-between">
                      <span className="font-serif font-bold text-lg">
                        ₹{Number(tpl.basePrice || 0).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[11px] font-mono opacity-80">{tpl.aspectRatio || '9:16'}</span>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-bold text-stone-900 text-sm truncate">{tpl.title}</h3>
                    <p className="text-xs text-stone-500 line-clamp-2 mt-1">{tpl.description}</p>
                    {isSample && (
                      <span className="inline-block mt-2 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                        Sample Video
                      </span>
                    )}
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                    <Link
                      to={`/templates/${tpl.slug || tId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 font-medium"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </Link>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(tpl)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-blush-700 hover:bg-blush-50"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError(null);
                          setDeletingTemplate(tpl);
                        }}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD / EDIT TEMPLATE MODAL */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-stone-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blush-50 text-blush-700 flex items-center justify-center">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-serif font-bold text-lg sm:text-xl text-stone-900">
                    {editingTemplate ? 'Edit Video Template' : 'Add New Video Template'}
                  </h2>
                  <p className="text-xs text-stone-400">
                    Set up video stream links, aspect ratio, audio details and inclusions.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <form onSubmit={handleSubmitForm} className="overflow-y-auto p-4 sm:p-6 space-y-6 flex-1 text-xs sm:text-sm">
              {formError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">{formError}</div>
                </div>
              )}

              {/* SECTION 1: MP4 Upload & Video Preview */}
              <div className="p-4 rounded-2xl bg-cream-50/70 border border-gold-200/60 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-gold-700" />
                    <span>Upload MP4 Video (Max 20MB)</span>
                  </label>
                  <span className="text-[11px] text-stone-500">Auto-generates preview & poster</span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4"
                    onChange={handleVideoFileChange}
                    className="hidden"
                    id="video-upload-input"
                    disabled={isUploading}
                  />
                  <label
                    htmlFor="video-upload-input"
                    className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed font-semibold text-xs cursor-pointer transition-colors ${
                      isUploading
                        ? 'bg-stone-100 text-stone-400 border-stone-300 cursor-not-allowed'
                        : 'bg-white hover:bg-blush-50 text-blush-700 border-blush-300 hover:border-blush-400'
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    <span>{isUploading ? 'Uploading Video...' : 'Choose MP4 File'}</span>
                  </label>

                  {isUploading && (
                    <div className="flex-1 flex items-center gap-3">
                      <div className="flex-1 bg-stone-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blush-600 h-2 rounded-full transition-all duration-200"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono font-bold text-stone-700">{uploadProgress}%</span>
                    </div>
                  )}
                </div>

                {uploadError && (
                  <p className="text-xs text-rose-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{uploadError}</span>
                  </p>
                )}

                {/* Direct Video & Thumbnail URL inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-stone-600 block">
                      Preview Video URL *
                    </label>
                    <input
                      type="url"
                      value={formData.previewVideoUrl}
                      onChange={(e) => setFormData({ ...formData, previewVideoUrl: e.target.value })}
                      placeholder="https://.../video.mp4"
                      required
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-mono focus:outline-none focus:border-blush-500 bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-stone-600 block">
                      Thumbnail Image URL *
                    </label>
                    <input
                      type="url"
                      value={formData.thumbnailUrl}
                      onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                      placeholder="https://.../poster.jpg"
                      required
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-mono focus:outline-none focus:border-blush-500 bg-white"
                    />
                  </div>
                </div>

                {/* Video Player Preview inside Modal */}
                {formData.previewVideoUrl && isHttpUrl(formData.previewVideoUrl) && (
                  <div className="pt-2">
                    <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block mb-1.5">
                      Live Video Player Preview:
                    </span>
                    <div className="rounded-xl overflow-hidden bg-black max-w-sm mx-auto shadow-md">
                      <video
                        src={formData.previewVideoUrl}
                        poster={formData.thumbnailUrl || undefined}
                        controls
                        playsInline
                        className="w-full max-h-56 object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 2: General Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
                    Template Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Royal Floral Mughal Wedding Invitation"
                    required
                    maxLength={120}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-blush-500 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-none focus:border-blush-500 bg-white font-medium"
                  >
                    {TEMPLATE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
                    Base Price (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                    placeholder="e.g. 1499"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-none focus:border-blush-500 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
                    Aspect Ratio
                  </label>
                  <select
                    value={formData.aspectRatio}
                    onChange={(e) => setFormData({ ...formData, aspectRatio: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-none focus:border-blush-500 bg-white font-mono"
                  >
                    {ASPECT_RATIOS.map((ratio) => (
                      <option key={ratio} value={ratio}>
                        {ratio} {ratio === '9:16' ? '(Reels / Stories Vertical)' : ratio === '16:9' ? '(Landscape TV)' : '(Square)'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
                    Standard Delivery Turnaround (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formData.deliveryDays}
                    onChange={(e) => setFormData({ ...formData, deliveryDays: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-none focus:border-blush-500 font-medium"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
                    Sample Audio Track Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.sampleAudioTitle}
                    onChange={(e) => setFormData({ ...formData, sampleAudioTitle: e.target.value })}
                    placeholder="e.g. Traditional Shehnai & Sitar Harmony"
                    maxLength={120}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-none focus:border-blush-500 font-medium"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
                    Description & Highlights *
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the aesthetic, transitions, and recommended events for this template..."
                    required
                    maxLength={3000}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-none focus:border-blush-500"
                  />
                </div>
              </div>

              {/* SECTION 3: What's Included */}
              <div className="space-y-2 pt-2 border-t border-stone-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                    What's Included List ({formData.whatsIncluded.length}/15)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddInclusion}
                    disabled={formData.whatsIncluded.length >= 15}
                    className="inline-flex items-center gap-1 text-xs text-blush-700 hover:text-blush-800 font-semibold disabled:opacity-40"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.whatsIncluded.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs font-mono text-stone-400 w-5">{idx + 1}.</span>
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => handleUpdateInclusion(idx, e.target.value)}
                        placeholder="Feature or perk included..."
                        className="flex-1 px-3 py-1.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-blush-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveInclusion(idx)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                        title="Remove line"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 4: Visibility, Featured & Sorting */}
              <div className="pt-2 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-blush-600 rounded border-stone-300 focus:ring-blush-400"
                  />
                  <div>
                    <span className="text-xs font-bold text-stone-800 block">Active / Visible</span>
                    <span className="text-[11px] text-stone-400">Showcase in public gallery</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="w-4 h-4 text-blush-600 rounded border-stone-300 focus:ring-blush-400"
                  />
                  <div>
                    <span className="text-xs font-bold text-stone-800 block">Featured Template</span>
                    <span className="text-[11px] text-stone-400">Promote to top carousel</span>
                  </div>
                </label>

                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-stone-600 uppercase tracking-wider">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting || isUploading}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blush-600 hover:bg-blush-700 text-white text-xs font-semibold shadow-soft hover:shadow-elevated transition-all disabled:opacity-50"
                >
                  {formSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Template...</span>
                    </>
                  ) : (
                    <span>{editingTemplate ? 'Update Template' : 'Create Template'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingTemplate && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-stone-900">Delete Template?</h3>
                <p className="text-xs text-stone-500">Order preservation policy applies</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Are you sure you want to remove <strong>"{deletingTemplate.title}"</strong>?
              <br />
              <span className="text-[11px] text-stone-500 block mt-2 bg-cream-50 p-2.5 rounded-xl border border-stone-200/60">
                Note: If any customer orders have already been placed using this template, it will automatically be safely <strong>hidden (archived)</strong> rather than permanently deleted, protecting all past customer records.
              </span>
            </p>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingTemplate(null)}
                className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteItem}
                disabled={deleteSubmitting}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
              >
                {deleteSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Confirm Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default AdminTemplatesPage;

