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
  Edit2,
  RefreshCw,
  Monitor,
  Smartphone,
} from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';

interface BannerItem {
  _id: string;
  title: string;
  imageUrl: string;
  mobileImageUrl?: string;
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
  const [editingBanner, setEditingBanner] = useState<BannerItem | null>(null);
  const [title, setTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [displayOrder, setDisplayOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);

  // Desktop Image state
  const [useUrlInput, setUseUrlInput] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>('');

  // Mobile Image state (separate & optional)
  const [useMobileUrlInput, setUseMobileUrlInput] = useState(false);
  const [mobileImageUrlInput, setMobileImageUrlInput] = useState('');
  const [selectedMobileFile, setSelectedMobileFile] = useState<File | null>(null);
  const [mobileFilePreview, setMobileFilePreview] = useState<string>('');
  const [removeMobileImage, setRemoveMobileImage] = useState(false);

  // Notifications
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mobileFileInputRef = useRef<HTMLInputElement>(null);

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
      setErrorMessage('Desktop file exceeds the 5 MB limit');
      return;
    }

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setErrorMessage('Invalid desktop file type. Please upload a JPG, PNG, or WebP image.');
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);

    // Create preview
    if (filePreview && filePreview.startsWith('blob:')) {
      URL.revokeObjectURL(filePreview);
    }
    const previewUrl = URL.createObjectURL(file);
    setFilePreview(previewUrl);
  };

  const handleMobileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Mobile image file exceeds the 5 MB limit');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setErrorMessage('Invalid mobile file type. Please upload a JPG, PNG, or WebP image.');
      return;
    }

    setErrorMessage(null);
    setSelectedMobileFile(file);
    setRemoveMobileImage(false);

    if (mobileFilePreview && mobileFilePreview.startsWith('blob:')) {
      URL.revokeObjectURL(mobileFilePreview);
    }
    const previewUrl = URL.createObjectURL(file);
    setMobileFilePreview(previewUrl);
  };

  const handleRemoveMobileImage = () => {
    setSelectedMobileFile(null);
    if (mobileFilePreview && mobileFilePreview.startsWith('blob:')) {
      URL.revokeObjectURL(mobileFilePreview);
    }
    setMobileFilePreview('');
    setMobileImageUrlInput('');
    setRemoveMobileImage(true);
    if (mobileFileInputRef.current) mobileFileInputRef.current.value = '';
  };

  const handleResetForm = () => {
    setTitle('');
    setLinkUrl('');
    setDisplayOrder(0);
    setIsActive(true);

    setSelectedFile(null);
    if (filePreview && filePreview.startsWith('blob:')) {
      URL.revokeObjectURL(filePreview);
    }
    setFilePreview('');
    setImageUrlInput('');
    setUseUrlInput(false);

    setSelectedMobileFile(null);
    if (mobileFilePreview && mobileFilePreview.startsWith('blob:')) {
      URL.revokeObjectURL(mobileFilePreview);
    }
    setMobileFilePreview('');
    setMobileImageUrlInput('');
    setUseMobileUrlInput(false);
    setRemoveMobileImage(false);

    setEditingBanner(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (mobileFileInputRef.current) mobileFileInputRef.current.value = '';
    setIsFormOpen(false);
  };

  const handleStartEdit = (banner: BannerItem) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setEditingBanner(banner);
    setTitle(banner.title);
    setLinkUrl(banner.linkUrl || '');
    setDisplayOrder(banner.displayOrder || 0);
    setIsActive(banner.isActive);

    setSelectedFile(null);
    if (filePreview && filePreview.startsWith('blob:')) {
      URL.revokeObjectURL(filePreview);
    }
    const isLocalOrBlob = banner.imageUrl?.startsWith('/uploads/');
    setUseUrlInput(!isLocalOrBlob);
    setImageUrlInput(banner.imageUrl || '');
    setFilePreview(banner.imageUrl || '');

    setSelectedMobileFile(null);
    if (mobileFilePreview && mobileFilePreview.startsWith('blob:')) {
      URL.revokeObjectURL(mobileFilePreview);
    }
    const hasMobile = Boolean(banner.mobileImageUrl && banner.mobileImageUrl.trim() !== '');
    const isMobileLocalOrBlob = banner.mobileImageUrl?.startsWith('/uploads/');
    setUseMobileUrlInput(hasMobile && !isMobileLocalOrBlob);
    setMobileImageUrlInput(banner.mobileImageUrl || '');
    setMobileFilePreview(banner.mobileImageUrl || '');
    setRemoveMobileImage(false);

    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!title.trim()) {
      setErrorMessage('Please enter a banner title.');
      return;
    }

    if (!editingBanner) {
      if (!useUrlInput && !selectedFile) {
        setErrorMessage('Please select a desktop image file to upload.');
        return;
      }

      if (useUrlInput && !imageUrlInput.trim()) {
        setErrorMessage('Please enter a desktop image URL.');
        return;
      }
    }

    try {
      setActionLoading(true);

      const url = editingBanner
        ? `/api/admin/hero-banners/${editingBanner._id}`
        : '/api/admin/hero-banners';
      const method = editingBanner ? 'PATCH' : 'POST';

      let res: Response;

      // If either desktop or mobile file was selected, use FormData
      if (selectedFile || selectedMobileFile) {
        const formData = new FormData();
        formData.append('title', title.trim());
        formData.append('linkUrl', linkUrl.trim());
        formData.append('displayOrder', String(displayOrder));
        formData.append('isActive', String(isActive));

        if (selectedFile) {
          formData.append('file', selectedFile);
        } else if (useUrlInput && imageUrlInput.trim()) {
          formData.append('imageUrl', imageUrlInput.trim());
        }

        if (selectedMobileFile) {
          formData.append('mobileFile', selectedMobileFile);
        } else if (useMobileUrlInput && mobileImageUrlInput.trim()) {
          formData.append('mobileImageUrl', mobileImageUrlInput.trim());
        }

        if (removeMobileImage) {
          formData.append('removeMobileImage', 'true');
        }

        res = await fetch(url, {
          method,
          body: formData,
        });
      } else {
        const payload: Record<string, unknown> = {
          title: title.trim(),
          linkUrl: linkUrl.trim(),
          displayOrder,
          isActive,
        };

        if (useUrlInput && imageUrlInput.trim()) {
          payload.imageUrl = imageUrlInput.trim();
        }

        if (useMobileUrlInput && mobileImageUrlInput.trim()) {
          payload.mobileImageUrl = mobileImageUrlInput.trim();
        }

        if (removeMobileImage) {
          payload.removeMobileImage = true;
        }

        res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (data.success) {
        setSuccessMessage(
          data.data?.message || (editingBanner ? 'Banner updated successfully' : 'Banner saved successfully')
        );
        handleResetForm();
        await fetchBanners();
      } else {
        setErrorMessage(data.error || 'Failed to save banner');
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

      {/* Upload / Edit Banner Drawer / Form */}
      {isFormOpen && (
        <div className="bg-white rounded-2xl border border-orange-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {editingBanner ? 'Edit & Replace Hero Banner' : 'Upload Hero Background Banner'}
              </h3>
              <p className="text-xs text-slate-500">
                {editingBanner
                  ? `Editing: ${editingBanner.title} (Upload a replacement image or modify display priority order/destination)`
                  : 'Recommended aspect ratio: 16:9 or 21:9 landscape (1920x800 or 1920x1080).'}
              </p>
            </div>
            <button
              onClick={handleResetForm}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
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

            {/* Image Selection: Separate Desktop and Mobile Banner Configuration */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2 border-t border-slate-100">
              {/* DESKTOP BANNER CARD */}
              <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                      <Monitor size={15} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Desktop Banner Image {editingBanner ? '(Optional to replace)' : <span className="text-rose-500">*</span>}
                      </label>
                      <span className="text-[11px] text-slate-500">
                        Recommended: ~2000 × 800 px (16:9 or 21:9 landscape)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setUseUrlInput(false)}
                      className={`px-2 py-0.5 rounded-md font-semibold transition-colors cursor-pointer ${
                        !useUrlInput
                          ? 'bg-orange-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      File
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseUrlInput(true)}
                      className={`px-2 py-0.5 rounded-md font-semibold transition-colors cursor-pointer ${
                        useUrlInput
                          ? 'bg-orange-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      URL
                    </button>
                  </div>
                </div>

                {!useUrlInput ? (
                  <div className="space-y-3">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-orange-500 bg-white hover:bg-orange-50/20 rounded-xl p-5 text-center cursor-pointer transition-colors"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <div className="flex flex-col items-center gap-1.5">
                        <UploadCloud size={20} className="text-orange-600" />
                        <div className="text-xs font-bold text-slate-800 truncate max-w-xs">
                          {selectedFile
                            ? selectedFile.name
                            : editingBanner
                            ? 'Click to replace desktop image file'
                            : 'Click to upload desktop image file'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          WebP, PNG, JPG up to 5 MB
                        </div>
                      </div>
                    </div>

                    {filePreview && (
                      <div className="relative w-full h-36 rounded-xl overflow-hidden border border-slate-200 shadow-2xs bg-slate-950">
                        <Image
                          src={filePreview}
                          alt="Desktop Banner Preview"
                          fill
                          unoptimized
                          className="object-contain"
                        />
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-slate-900/85 text-white text-[10px] font-bold rounded-md backdrop-blur-xs flex items-center gap-1">
                          <Monitor size={10} />
                          <span>{selectedFile ? 'New Desktop Image' : 'Current Desktop Image'}</span>
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
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    {imageUrlInput && (
                      <div className="relative w-full h-36 rounded-xl overflow-hidden border border-slate-200 shadow-2xs bg-slate-950">
                        <Image
                          src={imageUrlInput}
                          alt="Desktop URL Preview"
                          fill
                          unoptimized
                          className="object-contain"
                          onError={() => setErrorMessage('Failed to load desktop image preview from this URL')}
                        />
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-slate-900/85 text-white text-[10px] font-bold rounded-md backdrop-blur-xs flex items-center gap-1">
                          <Monitor size={10} />
                          <span>Desktop Preview (URL)</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* MOBILE BANNER CARD (OPTIONAL) */}
              <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                      <Smartphone size={15} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Mobile Banner Image
                        </label>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-slate-200 text-slate-600 rounded">
                          Optional
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        Recommended: ~750 × 1000 px (Portrait 3:4 ratio)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setUseMobileUrlInput(false)}
                      className={`px-2 py-0.5 rounded-md font-semibold transition-colors cursor-pointer ${
                        !useMobileUrlInput
                          ? 'bg-orange-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      File
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseMobileUrlInput(true)}
                      className={`px-2 py-0.5 rounded-md font-semibold transition-colors cursor-pointer ${
                        useMobileUrlInput
                          ? 'bg-orange-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      URL
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 leading-normal">
                  If no mobile image is provided, mobile screens will automatically fall back to the desktop banner image.
                </p>

                {!useMobileUrlInput ? (
                  <div className="space-y-3">
                    <div
                      onClick={() => mobileFileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-orange-500 bg-white hover:bg-orange-50/20 rounded-xl p-5 text-center cursor-pointer transition-colors"
                    >
                      <input
                        ref={mobileFileInputRef}
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                        onChange={handleMobileFileChange}
                        className="hidden"
                      />
                      <div className="flex flex-col items-center gap-1.5">
                        <UploadCloud size={20} className="text-orange-600" />
                        <div className="text-xs font-bold text-slate-800 truncate max-w-xs">
                          {selectedMobileFile
                            ? selectedMobileFile.name
                            : mobileFilePreview && !removeMobileImage
                            ? 'Click to replace mobile image file'
                            : 'Click to upload portrait mobile banner'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          WebP, PNG, JPG up to 5 MB
                        </div>
                      </div>
                    </div>

                    {mobileFilePreview && !removeMobileImage && (
                      <div className="flex items-center gap-4 p-3 bg-white border border-slate-200 rounded-xl">
                        {/* Portrait Preview Frame */}
                        <div className="relative w-20 h-28 rounded-lg overflow-hidden border border-slate-200 shadow-2xs bg-slate-950 shrink-0">
                          <Image
                            src={mobileFilePreview}
                            alt="Mobile Banner Preview"
                            fill
                            unoptimized
                            className="object-contain"
                          />
                        </div>

                        <div className="flex-1 space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-800">
                              {selectedMobileFile ? 'Selected for Mobile' : 'Active Mobile Banner'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate max-w-xs">
                            {selectedMobileFile ? selectedMobileFile.name : mobileFilePreview}
                          </p>
                          <button
                            type="button"
                            onClick={handleRemoveMobileImage}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                          >
                            <Trash2 size={11} />
                            <span>Remove Mobile Image (Use Desktop Fallback)</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="url"
                      value={mobileImageUrlInput}
                      onChange={(e) => {
                        setMobileImageUrlInput(e.target.value);
                        setRemoveMobileImage(false);
                      }}
                      placeholder="https://images.unsplash.com/... (portrait mobile)"
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />

                    {mobileImageUrlInput && !removeMobileImage && (
                      <div className="flex items-center gap-4 p-3 bg-white border border-slate-200 rounded-xl">
                        <div className="relative w-20 h-28 rounded-lg overflow-hidden border border-slate-200 shadow-2xs bg-slate-950 shrink-0">
                          <Image
                            src={mobileImageUrlInput}
                            alt="Mobile URL Preview"
                            fill
                            unoptimized
                            className="object-contain"
                            onError={() => setErrorMessage('Failed to load mobile image preview from this URL')}
                          />
                        </div>

                        <div className="flex-1 space-y-1.5">
                          <span className="text-xs font-bold text-slate-800">
                            Mobile Banner Preview (URL)
                          </span>
                          <p className="text-[11px] text-slate-500 truncate max-w-xs">
                            {mobileImageUrlInput}
                          </p>
                          <button
                            type="button"
                            onClick={handleRemoveMobileImage}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                          >
                            <Trash2 size={11} />
                            <span>Remove Mobile URL</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
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
                    <span>Saving...</span>
                  </>
                ) : editingBanner ? (
                  <>
                    <RefreshCw size={14} />
                    <span>Update Banner</span>
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
                    {/* Dual Thumbnail Preview: Desktop + Mobile */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Desktop Thumbnail */}
                      <div className="relative w-28 h-18 sm:w-36 sm:h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-950 shadow-2xs">
                        <Image
                          src={banner.imageUrl}
                          alt={`${banner.title} (Desktop)`}
                          fill
                          unoptimized
                          className="object-contain"
                        />
                        <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-slate-900/85 text-[9px] font-bold text-white rounded flex items-center gap-1">
                          <Monitor size={9} />
                          <span>Desktop</span>
                        </div>
                      </div>

                      {/* Mobile Thumbnail or Fallback Indicator */}
                      <div className="relative w-14 h-18 sm:w-16 sm:h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-950 shadow-2xs flex items-center justify-center">
                        {banner.mobileImageUrl ? (
                          <>
                            <Image
                              src={banner.mobileImageUrl}
                              alt={`${banner.title} (Mobile)`}
                              fill
                              unoptimized
                              className="object-contain"
                            />
                            <div className="absolute top-1 left-1 px-1 py-0.5 bg-orange-600/90 text-[8px] font-bold text-white rounded flex items-center gap-0.5">
                              <Smartphone size={8} />
                              <span>Mobile</span>
                            </div>
                          </>
                        ) : (
                          <div className="p-1 text-center flex flex-col items-center justify-center gap-0.5 text-slate-400">
                            <Smartphone size={12} className="text-slate-500" />
                            <span className="text-[8px] font-bold uppercase tracking-tight text-slate-400 text-center leading-none">
                              Fallback
                            </span>
                          </div>
                        )}
                      </div>
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

                        {banner.mobileImageUrl ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-full">
                            <Smartphone size={10} />
                            <span>Mobile Image Configured</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                            <Monitor size={10} />
                            <span>Mobile: Desktop Fallback</span>
                          </span>
                        )}
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
                        <span className="font-semibold text-slate-600">Order: {banner.displayOrder}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <button
                      onClick={() => handleStartEdit(banner)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
                      title="Edit banner details or replace image"
                    >
                      <Edit2 size={12} />
                      <span>Edit / Replace</span>
                    </button>

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
