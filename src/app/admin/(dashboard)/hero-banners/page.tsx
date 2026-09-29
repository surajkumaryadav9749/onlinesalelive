'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Image as ImageIcon,
  UploadCloud,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Trash2,
  Power,
  Info,
  Loader2,
  Plus,
  X,
  Clock,
  ArrowUpDown,
} from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';

interface BannerItem {
  _id: string;
  title: string;
  imageUrl: string;
  linkUrl?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminHeroBannersPage() {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeCount, setActiveCount] = useState(0);
  const [maxActive, setMaxActive] = useState(5);

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [displayOrder, setDisplayOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);
  const [useUrlInput, setUseUrlInput] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>('');

  // Notifications
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBanners = async () => {
    try {
      const res = await fetch('/api/admin/hero-banners');
      const data = await res.json();
      if (data.success && data.data) {
        setBanners(data.data.banners || []);
        setActiveCount(data.data.activeCount || 0);
        setMaxActive(data.data.maxActive || 5);
      } else {
        setErrorMessage(data.error || 'Failed to load hero banners');
      }
    } catch {
      setErrorMessage('Network error while loading hero banners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const res = await fetch('/api/admin/hero-banners');
        const data = await res.json();
        if (!ignore && data.success && data.data) {
          setBanners(data.data.banners || []);
          setActiveCount(data.data.activeCount || 0);
          setMaxActive(data.data.maxActive || 5);
        }
      } catch {
        if (!ignore) setErrorMessage('Network error while loading hero banners');
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Selected file exceeds the 5 MB limit');
      return;
    }

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setErrorMessage('Invalid file type. Please upload a JPG, PNG, or WebP image.');
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);

    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setFilePreview(previewUrl);
  };

  const handleResetForm = () => {
    setTitle('');
    setLinkUrl('');
    setDisplayOrder(0);
    setIsActive(true);
    setSelectedFile(null);
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview('');
    }
    setImageUrlInput('');
    setUseUrlInput(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsFormOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!title.trim()) {
      setErrorMessage('Please enter a banner title.');
      return;
    }

    if (!useUrlInput && !selectedFile) {
      setErrorMessage('Please select an image file to upload.');
      return;
    }

    if (useUrlInput && !imageUrlInput.trim()) {
      setErrorMessage('Please enter an image URL.');
      return;
    }

    try {
      setActionLoading(true);

      let res: Response;

      if (!useUrlInput && selectedFile) {
        const formData = new FormData();
        formData.append('title', title.trim());
        formData.append('linkUrl', linkUrl.trim());
        formData.append('displayOrder', String(displayOrder));
        formData.append('isActive', String(isActive));
        formData.append('file', selectedFile);

        res = await fetch('/api/admin/hero-banners', {
          method: 'POST',
          body: formData,
        });
      } else {
        res = await fetch('/api/admin/hero-banners', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            linkUrl: linkUrl.trim(),
            displayOrder,
            isActive,
            imageUrl: imageUrlInput.trim(),
          }),
        });
      }

      const data = await res.json();
      if (data.success) {
        setSuccessMessage(data.data?.message || 'Banner saved successfully');
        handleResetForm();
        await fetchBanners();
      } else {
        setErrorMessage(data.error || 'Failed to upload banner');
      }
    } catch {
      setErrorMessage('An unexpected error occurred while saving the banner.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (banner: BannerItem) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const nextStatus = !banner.isActive;
      const res = await fetch(`/api/admin/hero-banners/${banner._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(data.data?.message || `Banner ${nextStatus ? 'activated' : 'deactivated'} successfully`);
        await fetchBanners();
      } else {
        setErrorMessage(data.error || 'Failed to update banner status');
      }
    } catch {
      setErrorMessage('Network error while updating banner status');
    }
  };

  const handleDelete = async (banner: BannerItem) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${banner.title}"?`)) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await fetch(`/api/admin/hero-banners/${banner._id}?permanent=true`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage('Banner deleted successfully');
        await fetchBanners();
      } else {
        setErrorMessage(data.error || 'Failed to delete banner');
      }
    } catch {
      setErrorMessage('Network error while deleting banner');
    }
  };

  const isAtCapacity = activeCount >= maxActive;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <AdminHeader
        title="Hero Banners"
        subtitle="Manage the rotating background banner carousel for the homepage hero section (Max 5 active banners)."
      />

      {/* Capacity & Stats Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center shrink-0">
            <ImageIcon size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Hero Carousel Status</h2>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  isAtCapacity
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                Active: {activeCount} / {maxActive}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Total created banners: {banners.length} (including historical inactive banners).
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setErrorMessage(null);
            setSuccessMessage(null);
            setIsFormOpen(!isFormOpen);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          {isFormOpen ? <X size={15} /> : <Plus size={15} />}
          <span>{isFormOpen ? 'Cancel' : 'Upload New Banner'}</span>
        </button>
      </div>

      {/* Informational Message about Max 5 Active Banners */}
      {isAtCapacity && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-800 text-xs">
          <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Maximum 5 active banners allowed.</span> The oldest active banner will be automatically deactivated when a new active banner is uploaded.
          </div>
        </div>
      )}

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-emerald-800 text-xs">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
          <div className="font-semibold">{successMessage}</div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-xs">
          <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
          <div className="font-semibold">{errorMessage}</div>
        </div>
      )}

      {/* Upload New Banner Drawer / Form */}
      {isFormOpen && (
        <div className="bg-white rounded-2xl border border-orange-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Upload Hero Background Banner</h3>
              <p className="text-xs text-slate-500">
                Recommended aspect ratio: 16:9 or 21:9 landscape (1920x800 or 1920x1080).
              </p>
            </div>
            <button
              onClick={handleResetForm}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Banner Title / Internal Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Festive Mega Sale 2026 / Amazon Prime Day"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Destination URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Optional Click Destination URL
                </label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="e.g. /deals or /category/electronics or https://amazon.in/..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Leave blank if the banner is just a background visual with no link.
                </span>
              </div>
            </div>

            {/* Image Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Banner Image <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setUseUrlInput(false)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                      !useUrlInput
                        ? 'bg-orange-100 text-orange-700 font-bold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    File Upload
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => setUseUrlInput(true)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                      useUrlInput
                        ? 'bg-orange-100 text-orange-700 font-bold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    External Image URL
                  </button>
                </div>
              </div>

              {!useUrlInput ? (
                <div className="space-y-3">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-orange-500 bg-slate-50/60 hover:bg-orange-50/30 rounded-2xl p-6 text-center cursor-pointer transition-colors"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                        <UploadCloud size={20} />
                      </div>
                      <div className="text-xs font-bold text-slate-800">
                        {selectedFile ? selectedFile.name : 'Click to upload banner image file'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Supports WebP, PNG, JPG/JPEG (Max 5 MB)
                      </div>
                    </div>
                  </div>

                  {filePreview && (
                    <div className="relative w-full h-44 rounded-xl overflow-hidden border border-slate-200 shadow-2xs">
                      <Image
                        src={filePreview}
                        alt="Banner Preview"
                        fill
                        className="object-cover"
                      />
                      <div className="absolute bottom-2 left-2 px-2.5 py-1 bg-slate-900/70 text-white text-[11px] font-medium rounded-md backdrop-blur-xs">
                        Image Preview (Live)
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="https://images.unsplash.com/... or https://..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  {imageUrlInput && (
                    <div className="relative w-full h-44 rounded-xl overflow-hidden border border-slate-200 shadow-2xs">
                      <Image
                        src={imageUrlInput}
                        alt="URL Preview"
                        fill
                        className="object-cover"
                        onError={() => setErrorMessage('Failed to load image preview from this URL')}
                      />
                      <div className="absolute bottom-2 left-2 px-2.5 py-1 bg-slate-900/70 text-white text-[11px] font-medium rounded-md backdrop-blur-xs">
                        Image Preview (URL)
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Display Order & Active Toggle */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <ArrowUpDown size={12} />
                  <span>Display Priority Order</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Lower numbers display first (e.g. 0, 1, 2).
                </span>
              </div>

              <div className="flex items-center gap-3 pt-6">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-orange-600 rounded-sm focus:ring-orange-500"
                  />
                  <span>Publish as Active Banner</span>
                </label>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleResetForm}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="inline-flex items-center gap-2 px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud size={14} />
                    <span>Upload & Activate Banner</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Banners List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-sm">Configured Hero Banners</h3>
            <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-semibold">
              {banners.length}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <Loader2 size={24} className="animate-spin text-orange-600" />
            <span className="text-xs font-medium">Loading hero banners...</span>
          </div>
        ) : banners.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <ImageIcon size={22} />
            </div>
            <div className="text-sm font-bold text-slate-800">No Hero Banners Found</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              When no banners exist, the homepage displays the default clean background design. Upload your first promotional banner to activate the rotating carousel.
            </p>
            <button
              onClick={() => setIsFormOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              <Plus size={14} />
              <span>Upload First Banner</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {banners.map((banner) => {
              const formattedDate = banner.createdAt
                ? new Date(banner.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'N/A';

              return (
                <div
                  key={banner._id}
                  className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 hover:bg-slate-50/70 transition-colors"
                >
                  {/* Left: Thumbnail & Details */}
                  <div className="flex items-start sm:items-center gap-4 min-w-0">
                    {/* Thumbnail Preview */}
                    <div className="relative w-28 h-18 sm:w-36 sm:h-20 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-slate-100 shadow-2xs">
                      <Image
                        src={banner.imageUrl}
                        alt={banner.title}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Meta */}
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {banner.title}
                        </h4>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            banner.isActive
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {banner.isActive ? (
                            <>
                              <CheckCircle2 size={10} />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <XCircle size={10} />
                              <span>Inactive</span>
                            </>
                          )}
                        </span>
                      </div>

                      {banner.linkUrl ? (
                        <div className="flex items-center gap-1 text-xs text-orange-600 font-medium truncate">
                          <ExternalLink size={11} className="shrink-0" />
                          <span className="truncate">{banner.linkUrl}</span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400">No destination link</div>
                      )}

                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          <span>Created: {formattedDate}</span>
                        </span>
                        <span>•</span>
                        <span>Order: {banner.displayOrder}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <button
                      onClick={() => handleToggleStatus(banner)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                        banner.isActive
                          ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                      }`}
                    >
                      <Power size={12} />
                      <span>{banner.isActive ? 'Disable' : 'Enable'}</span>
                    </button>

                    <button
                      onClick={() => handleDelete(banner)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer"
                    >
                      <Trash2 size={12} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
