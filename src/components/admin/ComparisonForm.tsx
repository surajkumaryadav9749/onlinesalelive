'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';

export interface ComparisonFormData {
  _id?: string;
  title: string;
  slug: string;
  description: string;
  products: string[];
  productSlugs: string[];
  content: string;
  image: string;
  isPublished: boolean;
  seoTitle?: string;
  seoDescription?: string;
}

interface ComparisonFormProps {
  initialData?: ComparisonFormData;
  isEdit?: boolean;
}

interface ProductOption {
  _id: string;
  name: string;
  slug: string;
}

export const ComparisonForm: React.FC<ComparisonFormProps> = ({ initialData, isEdit }) => {
  const router = useRouter();
  const [productsList, setProductsList] = useState<ProductOption[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [formData, setFormData] = useState<ComparisonFormData>(
    initialData || {
      title: '',
      slug: '',
      description: '',
      products: [],
      productSlugs: [],
      content: '',
      image: '',
      isPublished: true,
      seoTitle: '',
      seoDescription: '',
    }
  );

  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(
    initialData?.products || []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch('/api/products?limit=100');
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setProductsList(data.data);
        }
      } catch (err) {
        console.error('Failed to load products', err);
      } finally {
        setLoadingProducts(false);
      }
    }
    loadProducts();
  }, []);

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

  const toggleProduct = (prod: ProductOption) => {
    if (selectedProductIds.includes(prod._id)) {
      setSelectedProductIds((prev) => prev.filter((id) => id !== prod._id));
    } else {
      setSelectedProductIds((prev) => [...prev, prod._id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Comparison title is required');
      return;
    }
    if (!formData.slug.trim()) {
      setError('Slug is required');
      return;
    }

    setSaving(true);

    try {
      const selectedSlugs = productsList
        .filter((p) => selectedProductIds.includes(p._id))
        .map((p) => p.slug);

      const payload = {
        ...formData,
        products: selectedProductIds,
        productSlugs: selectedSlugs,
      };

      const url = isEdit ? `/api/comparisons/${formData._id}` : '/api/comparisons';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save comparison');
      }

      router.push('/admin/comparisons');
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
          href="/admin/comparisons"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Comparisons
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : isEdit ? 'Update Comparison' : 'Save Comparison'}
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
          Comparison Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={handleTitleChange}
              placeholder="e.g. Sony WH-1000XM5 vs Bose QuietComfort Ultra"
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
              placeholder="sony-xm5-vs-bose-qc-ultra"
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
            placeholder="Executive summary comparing these products..."
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Image URL</label>
          <input
            type="text"
            value={formData.image}
            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            placeholder="https://images.unsplash.com/..."
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm font-mono text-xs"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Select Products to Compare ({selectedProductIds.length} selected)
          </label>
          <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg p-3 space-y-2 bg-slate-50/50">
            {loadingProducts ? (
              <p className="text-xs text-slate-500">Loading products...</p>
            ) : productsList.length === 0 ? (
              <p className="text-xs text-slate-500">No products available in catalog.</p>
            ) : (
              productsList.map((prod) => {
                const isSelected = selectedProductIds.includes(prod._id);
                return (
                  <label
                    key={prod._id}
                    className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors text-xs ${
                      isSelected ? 'bg-rose-50 border border-rose-200 font-medium' : 'hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleProduct(prod)}
                      className="w-4 h-4 text-rose-600 rounded border-slate-300"
                    />
                    <span className="text-slate-800">{prod.name}</span>
                    <span className="text-slate-400 font-mono ml-auto">/{prod.slug}</span>
                  </label>
                );
              })
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Detailed Comparison Content
          </label>
          <textarea
            rows={10}
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="Head-to-head breakdown (Design, Specs, Value for Money, Winner)..."
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm font-mono text-xs"
          />
        </div>

        <div className="pt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isPublished}
              onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
              className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
            />
            <span className="text-sm font-medium text-slate-700">Published (Visible on site)</span>
          </label>
        </div>
      </div>
    </form>
  );
};
