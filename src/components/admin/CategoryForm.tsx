'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Save,
  AlertCircle,
  UploadCloud,
  RefreshCw,
  Trash2,
  Tv,
  Smartphone,
  Laptop,
  Shirt,
  Footprints,
  Sparkles,
  Home,
  Watch,
  Headphones,
  Tag,
  ShoppingBag,
} from 'lucide-react';

const COMMON_ICONS: Record<string, React.ElementType> = {
  Tv,
  Smartphone,
  Laptop,
  Shirt,
  Footprints,
  Sparkles,
  Home,
  Watch,
  Headphones,
  ShoppingBag,
  Tag,
};

interface CategoryFormData {
  _id?: string;
  name: string;
  slug: string;
  icon: string;
  iconKey?: string;
  description: string;
  image: string;
  imageUrl?: string;
  itemCount: number;
  featured: boolean;
  isActive: boolean;
}

interface CategoryFormProps {
  initialData?: CategoryFormData;
  isEdit?: boolean;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({ initialData, isEdit }) => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialImageUrl = initialData?.imageUrl || initialData?.image || '';
  const initialIcon = initialData?.iconKey || initialData?.icon || 'Tv';

  const [formData, setFormData] = useState<CategoryFormData>(
    initialData || {
      name: '',
      slug: '',
      icon: initialIcon,
      iconKey: initialIcon,
      description: '',
      image: initialImageUrl,
      imageUrl: initialImageUrl,
      itemCount: 0,
      featured: false,
      isActive: true,
    }
  );

  // Image Upload / Preview State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(initialImageUrl);
  const [isRemovingImage, setIsRemovingImage] = useState<boolean>(false);
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false);
  const [customUrl, setCustomUrl] = useState<string>(initialImageUrl);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!isEdit && (!formData.slug || formData.slug === generateSlug(formData.name))) {
      setFormData((prev) => ({ ...prev, name: val, slug: generateSlug(val) }));
    } else {
      setFormData((prev) => ({ ...prev, name: val }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(`File size exceeds the 5 MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB)`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setError('Invalid file type. Please upload a JPG, JPEG, PNG, or WebP image.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setError('');
    setSelectedFile(file);
    setIsRemovingImage(false);

    // Clean up previous blob URL if exists
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleRemoveImage = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl('');
    setIsRemovingImage(true);
    setCustomUrl('');
    setFormData((prev) => ({ ...prev, image: '', imageUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCustomUrlApply = () => {
    const trimmed = customUrl.trim();
    if (!trimmed) {
      handleRemoveImage();
      return;
    }
    setSelectedFile(null);
    setIsRemovingImage(false);
    setPreviewUrl(trimmed);
    setFormData((prev) => ({ ...prev, image: trimmed, imageUrl: trimmed }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const url = isEdit
      ? `/api/categories/${initialData?._id}`
      : '/api/categories';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      let res: Response;

      if (selectedFile) {
        // Send multipart/form-data with file
        const data = new FormData();
        data.append('name', formData.name);
        data.append('slug', formData.slug);
        data.append('description', formData.description || '');
        data.append('icon', formData.icon || 'Tv');
        data.append('iconKey', formData.icon || 'Tv');
        data.append('featured', String(formData.featured));
        data.append('isActive', String(formData.isActive));
        data.append('file', selectedFile);

        res = await fetch(url, {
          method,
          body: data,
        });
      } else {
        // Send JSON
        const payload = {
          ...formData,
          iconKey: formData.icon || 'Tv',
          image: isRemovingImage ? '' : formData.imageUrl || formData.image || '',
          imageUrl: isRemovingImage ? '' : formData.imageUrl || formData.image || '',
          removeImage: isRemovingImage,
        };

        res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const result = await res.json();
      if (!res.ok || !result.success) {
        setError(result.error || 'Failed to save category');
        setSaving(false);
        return;
      }

      router.push('/admin/categories');
      router.refresh();
    } catch {
      setError('Network error saving category');
      setSaving(false);
    }
  };

  const SelectedIconComponent = COMMON_ICONS[formData.icon] || Tv;

  return (
    <form onSubmit={handleSubmit} className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/categories"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Categories</span>
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Save size={15} />
          <span>{saving ? 'Saving...' : isEdit ? 'Update Category' : 'Create Category'}</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-2xs">
        {/* Name & Slug */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Category Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Electronics"
              value={formData.name}
              onChange={handleNameChange}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Slug <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. electronics"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white font-mono text-slate-900"
            />
          </div>
        </div>

        {/* ==================================================== */}
        {/* CATEGORY IMAGE UPLOAD & PREVIEW SECTION             */}
        {/* ==================================================== */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Category Image
            </label>
            <span className="text-[11px] font-medium text-slate-400">
              Optional — JPG, PNG, WebP up to 5 MB
            </span>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Image Preview & Controls (if image exists) */}
          {previewUrl && !isRemovingImage ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              {/* Image Thumbnail */}
              <div className="relative w-32 h-24 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs shrink-0">
                <Image
                  src={previewUrl}
                  alt={formData.name || 'Category image'}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Info & Action Buttons */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">
                    {selectedFile ? 'Selected for upload' : 'Current Category Image'}
                  </span>
                  {selectedFile && (
                    <span className="text-[10px] font-semibold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 truncate max-w-md">
                  {selectedFile ? selectedFile.name : previewUrl}
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  >
                    <RefreshCw size={12} />
                    <span>Replace Image</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  >
                    <Trash2 size={12} />
                    <span>Remove Image</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Upload Dropzone / Button (when no image exists) */
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-orange-500 rounded-2xl p-6 text-center bg-slate-50/50 hover:bg-orange-50/20 transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                <UploadCloud size={24} />
              </div>
              <p className="text-xs font-bold text-slate-800 group-hover:text-orange-600 transition-colors">
                Click to Upload Category Image
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Supports JPG, JPEG, PNG, and WebP (Max 5 MB)
              </p>
            </div>
          )}

          {/* Fallback info */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>
              If no image is uploaded, the category will automatically display its selected Lucide icon.
            </span>
            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="text-orange-600 hover:text-orange-700 underline font-medium cursor-pointer"
            >
              {showUrlInput ? 'Hide URL input' : 'Or use Image URL'}
            </button>
          </div>

          {/* Optional External Image URL input */}
          {showUrlInput && (
            <div className="flex gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <input
                type="url"
                placeholder="https://images.unsplash.com/photo-..."
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900"
              />
              <button
                type="button"
                onClick={handleCustomUrlApply}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Apply URL
              </button>
            </div>
          )}
        </div>

        {/* Lucide Icon & Preview */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
            Fallback Category Icon
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            <div className="sm:col-span-2">
              <input
                type="text"
                placeholder="e.g. Laptop, Headphones, Tv, Shirt..."
                value={formData.icon}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    icon: e.target.value,
                    iconKey: e.target.value,
                  })
                }
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white text-slate-900"
              />
              {/* Quick Icon Chips */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {Object.keys(COMMON_ICONS).map((iconName) => (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        icon: iconName,
                        iconKey: iconName,
                      })
                    }
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                      formData.icon === iconName
                        ? 'bg-orange-100 text-orange-700 border-orange-300'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {iconName}
                  </button>
                ))}
              </div>
            </div>

            {/* Icon Preview */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shadow-2xs shrink-0">
                <SelectedIconComponent size={22} />
              </div>
              <div className="text-[11px] leading-tight">
                <div className="font-bold text-slate-800">{formData.icon || 'Tv'}</div>
                <div className="text-slate-400">Fallback icon</div>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="pt-2 border-t border-slate-100">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Description
          </label>
          <textarea
            rows={3}
            placeholder="Brief summary for category headers and meta description..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white text-slate-900 resize-none"
          />
        </div>

        {/* Checkboxes */}
        <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-slate-100">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={formData.featured}
              onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
              className="rounded text-orange-600 focus:ring-orange-500"
            />
            <span>Featured on Homepage</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded text-orange-600 focus:ring-orange-500"
            />
            <span>Active / Published</span>
          </label>
        </div>
      </div>
    </form>
  );
};
