'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { MarketplaceName, DealType } from '@/types';

interface MarketplaceInput {
  name: MarketplaceName;
  price: number | string;
  originalPrice?: number | string;
  url: string;
  affiliateUrl?: string;
  isAffiliate?: boolean;
  isActive?: boolean;
  inStock: boolean;
  dealBadge?: string;
  deliveryInfo?: string;
  couponCode?: string;
  couponText?: string;
}

export interface ProductFormData {
  _id?: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  images: string[];
  category: string; // Category ID
  categorySlug: string;
  price: number | string;
  originalPrice: number | string;
  discountPercent: number | string;
  rating: number | string;
  reviewCount: number | string;
  pros: string[];
  cons: string[];
  specifications: Record<string, string>;
  marketplaces: MarketplaceInput[];
  dealType: DealType;
  dealStatus: 'active' | 'upcoming' | 'expired';
  isFeatured: boolean;
  isTrending: boolean;
  badgeText: string;
  isActive: boolean;
}

interface ProductFormProps {
  initialData?: ProductFormData;
  isEdit?: boolean;
}

interface CategoryOption {
  _id: string;
  name: string;
  slug: string;
}

const MARKETPLACE_OPTIONS: MarketplaceName[] = ['Amazon', 'Flipkart', 'Myntra', 'AJIO', 'Meesho'];
const DEAL_TYPE_OPTIONS: DealType[] = [
  "Today's Deal",
  'Sale',
  'Major Discount',
  'Flash Deal',
  'Featured Deal',
  'Price Drop',
];

export const ProductForm: React.FC<ProductFormProps> = ({ initialData, isEdit }) => {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [formData, setFormData] = useState<ProductFormData>(
    initialData
      ? {
          ...initialData,
          marketplaces: (initialData.marketplaces || []).map((m) => ({
            ...m,
            originalPrice: m.originalPrice ?? '',
            affiliateUrl: m.affiliateUrl ?? '',
            isAffiliate: Boolean(m.isAffiliate),
            isActive: m.isActive !== false,
            inStock: Boolean(m.inStock),
            couponCode: m.couponCode ?? '',
            couponText: m.couponText ?? '',
          })),
        }
      : {
          name: '',
          slug: '',
          description: '',
          image: '',
          images: [],
          category: '',
          categorySlug: '',
          price: '',
          originalPrice: '',
          discountPercent: '',
          rating: 4.5,
          reviewCount: 0,
          pros: [],
          cons: [],
          specifications: {},
          marketplaces: [
            {
              name: 'Amazon',
              price: '',
              originalPrice: '',
              url: '',
              affiliateUrl: '',
              isAffiliate: false,
              isActive: true,
              inStock: true,
            },
            {
              name: 'Flipkart',
              price: '',
              originalPrice: '',
              url: '',
              affiliateUrl: '',
              isAffiliate: false,
              isActive: true,
              inStock: true,
            },
          ],
          dealType: "Today's Deal",
          dealStatus: 'active',
          isFeatured: false,
          isTrending: false,
          badgeText: '',
          isActive: true,
        }
  );

  const [imagesText, setImagesText] = useState(
    initialData?.images && initialData.images.length > 0
      ? initialData.images.join('\n')
      : initialData?.image || ''
  );
  const [prosText, setProsText] = useState(initialData?.pros?.join('\n') || '');
  const [consText, setConsText] = useState(initialData?.cons?.join('\n') || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setCategories(data.data);
          // If category not set and options exist, default to first
          setFormData((prev) => {
            if (!prev.category && data.data.length > 0) {
              return {
                ...prev,
                category: data.data[0]._id,
                categorySlug: data.data[0].slug,
              };
            }
            return prev;
          });
        }
      } catch (err) {
        console.error('Failed to load categories', err);
      } finally {
        setLoadingCategories(false);
      }
    }
    loadCategories();
  }, []);

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

  const handlePriceChange = (priceVal: string, originalPriceVal: string) => {
    const p = parseFloat(priceVal);
    const op = parseFloat(originalPriceVal);
    let discount = formData.discountPercent;
    if (!isNaN(p) && !isNaN(op) && op > p && op > 0) {
      discount = Math.round(((op - p) / op) * 100);
    }
    setFormData((prev) => ({
      ...prev,
      price: priceVal,
      originalPrice: originalPriceVal,
      discountPercent: discount,
    }));
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const catId = e.target.value;
    const found = categories.find((c) => c._id === catId);
    setFormData((prev) => ({
      ...prev,
      category: catId,
      categorySlug: found ? found.slug : prev.categorySlug,
    }));
  };

  const updateMarketplace = (
    index: number,
    field: keyof MarketplaceInput,
    value: MarketplaceInput[keyof MarketplaceInput]
  ) => {
    const updated = [...formData.marketplaces];
    updated[index] = { ...updated[index], [field]: value };
    setFormData((prev) => ({ ...prev, marketplaces: updated }));
  };

  const addMarketplace = () => {
    const available = MARKETPLACE_OPTIONS.find(
      (m) => !formData.marketplaces.some((mp) => mp.name === m)
    ) || 'Amazon';
    setFormData((prev) => ({
      ...prev,
      marketplaces: [
        ...prev.marketplaces,
        {
          name: available,
          price: '',
          originalPrice: '',
          url: '',
          affiliateUrl: '',
          isAffiliate: false,
          isActive: true,
          inStock: true,
          couponCode: '',
          couponText: '',
        },
      ],
    }));
  };

  const removeMarketplace = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      marketplaces: prev.marketplaces.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Product name is required');
      return;
    }
    if (!formData.slug.trim()) {
      setError('Product slug is required');
      return;
    }
    if (!formData.category) {
      setError('Category is required');
      return;
    }
    if (!formData.price || isNaN(Number(formData.price))) {
      setError('Valid price is required');
      return;
    }

    setSaving(true);

    try {
      const parsedImages = imagesText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      const parsedPros = prosText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      const parsedCons = consText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        ...formData,
        price: Number(formData.price),
        originalPrice: Number(formData.originalPrice) || Number(formData.price),
        discountPercent: Number(formData.discountPercent) || 0,
        rating: Number(formData.rating) || 4.5,
        reviewCount: Number(formData.reviewCount) || 0,
        image: parsedImages[0] || formData.image || '',
        images: parsedImages.length > 0 ? parsedImages : [formData.image].filter(Boolean),
        pros: parsedPros,
        cons: parsedCons,
        marketplaces: formData.marketplaces.map((m) => ({
          ...m,
          price: m.price ? Number(m.price) : null,
          originalPrice: m.originalPrice ? Number(m.originalPrice) : undefined,
          url: m.url || '#',
          affiliateUrl: m.affiliateUrl || '',
          isAffiliate: Boolean(m.isAffiliate),
          isActive: m.isActive !== false,
          inStock: Boolean(m.inStock),
          couponCode: m.couponCode || '',
          couponText: m.couponText || '',
        })),
      };

      const url = isEdit ? `/api/products/${formData._id}` : '/api/products';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save product');
      }

      router.push('/admin/products');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl space-y-8 pb-16">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Products
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-3 text-rose-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Info */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-3">
          Basic Product Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Product Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={handleNameChange}
              placeholder="e.g. Sony WH-1000XM5 Wireless Headphones"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              URL Slug <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="sony-wh-1000xm5-wireless-headphones"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm font-mono text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={handleCategoryChange}
              disabled={loadingCategories}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm bg-white"
            >
              {loadingCategories ? (
                <option>Loading categories...</option>
              ) : (
                categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.slug})
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Badge Text (Optional)</label>
            <input
              type="text"
              value={formData.badgeText}
              onChange={(e) => setFormData({ ...formData, badgeText: e.target.value })}
              placeholder="e.g. Bestseller, Editor's Pick"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Write a clear, informative summary of this product and why it's worth buying..."
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Image URLs (one per line, first is primary)
          </label>
          <textarea
            rows={3}
            value={imagesText}
            onChange={(e) => setImagesText(e.target.value)}
            placeholder="https://images.unsplash.com/..."
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm font-mono text-xs"
          />
        </div>
      </div>

      {/* Pricing & Deals */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-3">
          Pricing & Deal Status
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Current Price (₹) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              required
              min="0"
              step="1"
              value={formData.price}
              onChange={(e) => handlePriceChange(e.target.value, String(formData.originalPrice))}
              placeholder="1999"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Original Price (₹)</label>
            <input
              type="number"
              min="0"
              step="1"
              value={formData.originalPrice}
              onChange={(e) => handlePriceChange(String(formData.price), e.target.value)}
              placeholder="3999"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Discount (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.discountPercent}
              onChange={(e) => setFormData({ ...formData, discountPercent: e.target.value })}
              placeholder="50"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Rating (0 - 5)</label>
            <input
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={formData.rating}
              onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Review Count</label>
            <input
              type="number"
              min="0"
              value={formData.reviewCount}
              onChange={(e) => setFormData({ ...formData, reviewCount: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Deal Type</label>
            <select
              value={formData.dealType}
              onChange={(e) => setFormData({ ...formData, dealType: e.target.value as DealType })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm bg-white"
            >
              {DEAL_TYPE_OPTIONS.map((dt) => (
                <option key={dt} value={dt}>
                  {dt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Deal Status</label>
            <select
              value={formData.dealStatus}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  dealStatus: e.target.value as 'active' | 'upcoming' | 'expired',
                })
              }
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm bg-white"
            >
              <option value="active">Active</option>
              <option value="upcoming">Upcoming</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 pt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isFeatured}
              onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
              className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
            />
            <span className="text-sm font-medium text-slate-700">Featured on Homepage</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isTrending}
              onChange={(e) => setFormData({ ...formData, isTrending: e.target.checked })}
              className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
            />
            <span className="text-sm font-medium text-slate-700">Trending Now</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
            />
            <span className="text-sm font-medium text-slate-700">Active (Publicly Visible)</span>
          </label>
        </div>
      </div>

      {/* Marketplaces */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Marketplace Listings</h2>
            <p className="text-xs text-slate-500">
              Add comparison prices and destination URLs for supported stores (Amazon, Flipkart, etc.)
            </p>
          </div>
          <button
            type="button"
            onClick={addMarketplace}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Marketplace
          </button>
        </div>

        <div className="space-y-4">
          {formData.marketplaces.map((mp, index) => (
            <div
              key={index}
              className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3"
            >
              {/* Row 1: Store & Prices */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div className="sm:col-span-4">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Store</label>
                  <select
                    value={mp.name}
                    onChange={(e) =>
                      updateMarketplace(index, 'name', e.target.value as MarketplaceName)
                    }
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-medium"
                  >
                    {MARKETPLACE_OPTIONS.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Current Offer Price (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="Offer Price"
                    value={mp.price}
                    onChange={(e) => updateMarketplace(index, 'price', e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Original MRP (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="Original MRP"
                    value={mp.originalPrice ?? ''}
                    onChange={(e) => updateMarketplace(index, 'originalPrice', e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                  />
                </div>

                <div className="sm:col-span-2 flex justify-end pt-5">
                  <button
                    type="button"
                    onClick={() => removeMarketplace(index)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Remove store"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </div>

              {/* Row 2: URLs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Standard Store URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={mp.url}
                    onChange={(e) => updateMarketplace(index, 'url', e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Affiliate / Deep Link URL (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="https://amzn.to/... or partner link"
                    value={mp.affiliateUrl ?? ''}
                    onChange={(e) => updateMarketplace(index, 'affiliateUrl', e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                  />
                </div>
              </div>

              {/* Row 3: Coupons & Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center pt-1 border-t border-slate-200/60">
                <div className="sm:col-span-3">
                  <input
                    type="text"
                    placeholder="Coupon Code (Optional)"
                    value={mp.couponCode ?? ''}
                    onChange={(e) => updateMarketplace(index, 'couponCode', e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                  />
                </div>

                <div className="sm:col-span-3">
                  <input
                    type="text"
                    placeholder="Coupon text (e.g. ₹200 OFF)"
                    value={mp.couponText ?? ''}
                    onChange={(e) => updateMarketplace(index, 'couponText', e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                  />
                </div>

                <div className="sm:col-span-6 flex flex-wrap items-center gap-4 text-xs">
                  <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={mp.inStock}
                      onChange={(e) => updateMarketplace(index, 'inStock', e.target.checked)}
                      className="w-3.5 h-3.5 text-rose-600 rounded"
                    />
                    In Stock
                  </label>

                  <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={mp.isActive !== false}
                      onChange={(e) => updateMarketplace(index, 'isActive', e.target.checked)}
                      className="w-3.5 h-3.5 text-rose-600 rounded"
                    />
                    Active on Site
                  </label>

                  <label className="flex items-center gap-1.5 text-emerald-800 cursor-pointer font-medium bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                    <input
                      type="checkbox"
                      checked={Boolean(mp.isAffiliate)}
                      onChange={(e) => updateMarketplace(index, 'isAffiliate', e.target.checked)}
                      className="w-3.5 h-3.5 text-emerald-600 rounded"
                    />
                    Affiliate Enabled
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pros & Cons */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-3">
          Editorial Evaluation (Pros & Cons)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-emerald-700 mb-1">
              Pros (one per line)
            </label>
            <textarea
              rows={4}
              value={prosText}
              onChange={(e) => setProsText(e.target.value)}
              placeholder="Class-leading noise cancellation&#10;Exceptional battery life&#10;Comfortable lightweight design"
              className="w-full px-4 py-2 border border-emerald-200 bg-emerald-50/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-rose-700 mb-1">
              Cons (one per line)
            </label>
            <textarea
              rows={4}
              value={consText}
              onChange={(e) => setConsText(e.target.value)}
              placeholder="Does not fold completely&#10;Premium pricing&#10;Microphone pickup is average in windy environments"
              className="w-full px-4 py-2 border border-rose-200 bg-rose-50/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm"
            />
          </div>
        </div>
      </div>
    </form>
  );
};
