'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { MarketplaceName, DealType } from '@/types';
import { calculateDiscount, getDealStatus } from '@/lib/deal-utils';

export interface DealFormData {
  _id?: string;
  title: string;
  slug: string;
  description: string;
  image: string;
  currentPrice: number | string;
  originalPrice: number | string;
  discountPercent: number | string;
  marketplace: MarketplaceName;
  marketplaceUrl: string;
  affiliateUrl?: string;
  isAffiliate?: boolean;
  dealType: DealType;
  endsIn: string;
  startDate?: string;
  endDate?: string;
  status: 'active' | 'expired' | 'upcoming' | 'inactive';
  isFeatured: boolean;
  verified: boolean;
  isActive: boolean;
}

interface DealFormProps {
  initialData?: DealFormData;
  isEdit?: boolean;
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

export const DealForm: React.FC<DealFormProps> = ({ initialData, isEdit }) => {
  const router = useRouter();

  const [formData, setFormData] = useState<DealFormData>(
    initialData
      ? {
          ...initialData,
          affiliateUrl: initialData.affiliateUrl ?? '',
          isAffiliate: Boolean(initialData.isAffiliate),
          startDate: initialData.startDate
            ? new Date(initialData.startDate).toISOString().slice(0, 16)
            : '',
          endDate: initialData.endDate
            ? new Date(initialData.endDate).toISOString().slice(0, 16)
            : '',
        }
      : {
          title: '',
          slug: '',
          description: '',
          image: '',
          currentPrice: '',
          originalPrice: '',
          discountPercent: '',
          marketplace: 'Amazon',
          marketplaceUrl: '#',
          affiliateUrl: '',
          isAffiliate: false,
          dealType: "Today's Deal",
          endsIn: 'Limited time',
          startDate: '',
          endDate: '',
          status: 'active',
          isFeatured: false,
          verified: true,
          isActive: true,
        }
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!isEdit && (!formData.slug || formData.slug === generateSlug(formData.title))) {
      setFormData((prev) => ({ ...prev, title: val, slug: generateSlug(val) }));
    } else {
      setFormData((prev) => ({ ...prev, title: val }));
    }
  };

  const handlePriceChange = (priceVal: string, originalPriceVal: string) => {
    const p = parseFloat(priceVal);
    const op = parseFloat(originalPriceVal);
    let discount = formData.discountPercent;
    if (!isNaN(p) && !isNaN(op) && op > p && op > 0) {
      discount = calculateDiscount(p, op);
    }
    setFormData((prev) => ({
      ...prev,
      currentPrice: priceVal,
      originalPrice: originalPriceVal,
      discountPercent: discount,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Deal title is required');
      return;
    }
    if (!formData.slug.trim()) {
      setError('Slug is required');
      return;
    }
    if (!formData.currentPrice || isNaN(Number(formData.currentPrice))) {
      setError('Valid current price is required');
      return;
    }

    setSaving(true);

    try {
      const p = Number(formData.currentPrice);
      const op = Number(formData.originalPrice) || p;
      const calculatedDiscount = calculateDiscount(p, op);

      const dynamicStatus = getDealStatus({
        isActive: formData.isActive,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        status: formData.status,
      });

      const payload = {
        ...formData,
        currentPrice: p,
        originalPrice: op,
        discountPercent: calculatedDiscount || Number(formData.discountPercent) || 0,
        status: dynamicStatus,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
        affiliateUrl: formData.affiliateUrl || '',
        isAffiliate: Boolean(formData.isAffiliate),
      };

      const url = isEdit ? `/api/deals/${formData._id}` : '/api/deals';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save deal');
      }

      router.push('/admin/deals');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl space-y-8 pb-16">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/deals"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Deals
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : isEdit ? 'Update Deal' : 'Publish Deal'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-3 text-rose-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-3">
          Deal Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Deal Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={handleTitleChange}
              placeholder="e.g. Sony WH-1000XM5 Flat ₹7,000 Off"
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
              placeholder="sony-wh-1000xm5-flat-7000-off"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm font-mono text-xs"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Key highlights of this promotion or coupon..."
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Store / Marketplace</label>
            <select
              value={formData.marketplace}
              onChange={(e) =>
                setFormData({ ...formData, marketplace: e.target.value as MarketplaceName })
              }
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm bg-white"
            >
              {MARKETPLACE_OPTIONS.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Standard Store Link (URL)</label>
            <input
              type="text"
              value={formData.marketplaceUrl}
              onChange={(e) => setFormData({ ...formData, marketplaceUrl: e.target.value })}
              placeholder="https://www.amazon.in/..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Affiliate / Deep Link URL (optional)</label>
            <input
              type="text"
              value={formData.affiliateUrl ?? ''}
              onChange={(e) => setFormData({ ...formData, affiliateUrl: e.target.value })}
              placeholder="https://amzn.to/... or tracking URL"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm font-mono text-xs"
            />
          </div>

          <div className="flex items-center gap-2 pt-6">
            <label className="flex items-center gap-2 cursor-pointer bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">
              <input
                type="checkbox"
                checked={Boolean(formData.isAffiliate)}
                onChange={(e) => setFormData({ ...formData, isAffiliate: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <span className="text-xs font-semibold text-emerald-900">Affiliate Link Enabled</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Deal Image URL</label>
          <input
            type="text"
            value={formData.image}
            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            placeholder="https://images.unsplash.com/..."
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm font-mono text-xs"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-3">
          Pricing & Schedule
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Deal Price (₹) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              required
              min="0"
              value={formData.currentPrice}
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
              value={formData.originalPrice}
              onChange={(e) => handlePriceChange(String(formData.currentPrice), e.target.value)}
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Status Override</label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as 'active' | 'expired' | 'upcoming' | 'inactive',
                })
              }
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm bg-white"
            >
              <option value="active">Active</option>
              <option value="upcoming">Upcoming</option>
              <option value="expired">Expired</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Badge / Ends In Text</label>
            <input
              type="text"
              value={formData.endsIn}
              onChange={(e) => setFormData({ ...formData, endsIn: e.target.value })}
              placeholder="e.g. Ends in 3 hours"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-1">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Start Date & Time (Optional)</label>
            <input
              type="datetime-local"
              value={formData.startDate ?? ''}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">End / Expiry Date & Time (Optional)</label>
            <input
              type="datetime-local"
              value={formData.endDate ?? ''}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm"
            />
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
            <span className="text-sm font-medium text-slate-700">Featured Deal</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.verified}
              onChange={(e) => setFormData({ ...formData, verified: e.target.checked })}
              className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
            />
            <span className="text-sm font-medium text-slate-700">Verified Deal Badge</span>
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
    </form>
  );
};
