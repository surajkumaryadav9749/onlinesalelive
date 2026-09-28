'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';

export interface ReviewFormData {
  _id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  product?: string;
  productName: string;
  productSlug: string;
  image: string;
  rating: number | string;
  verdict: string;
  pros: string[];
  cons: string[];
  price: number | string;
  originalPrice: number | string;
  discountPercent: number | string;
  author: string;
  isPublished: boolean;
  seoTitle?: string;
  seoDescription?: string;
}

interface ReviewFormProps {
  initialData?: ReviewFormData;
  isEdit?: boolean;
}

interface ProductOption {
  _id: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  originalPrice: number;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({ initialData, isEdit }) => {
  const router = useRouter();
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [formData, setFormData] = useState<ReviewFormData>(
    initialData || {
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      product: '',
      productName: '',
      productSlug: '',
      image: '',
      rating: 4.5,
      verdict: '',
      pros: [],
      cons: [],
      price: '',
      originalPrice: '',
      discountPercent: '',
      author: 'Editorial Team',
      isPublished: true,
      seoTitle: '',
      seoDescription: '',
    }
  );

  const [prosText, setProsText] = useState(initialData?.pros?.join('\n') || '');
  const [consText, setConsText] = useState(initialData?.cons?.join('\n') || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch('/api/products?limit=100');
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setProducts(data.data);
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

  const handleProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const prodId = e.target.value;
    const prod = products.find((p) => p._id === prodId);
    if (prod) {
      setFormData((prev) => ({
        ...prev,
        product: prod._id,
        productName: prod.name,
        productSlug: prod.slug,
        image: prev.image || prod.image,
        price: prev.price || prod.price,
        originalPrice: prev.originalPrice || prod.originalPrice,
      }));
    } else {
      setFormData((prev) => ({ ...prev, product: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Review title is required');
      return;
    }
    if (!formData.slug.trim()) {
      setError('Slug is required');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...formData,
        rating: Number(formData.rating) || 4.5,
        price: Number(formData.price) || 0,
        originalPrice: Number(formData.originalPrice) || Number(formData.price) || 0,
        discountPercent: Number(formData.discountPercent) || 0,
        pros: prosText
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        cons: consText
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
      };

      const url = isEdit ? `/api/reviews/${formData._id}` : '/api/reviews';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save review');
      }

      router.push('/admin/reviews');
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
          href="/admin/reviews"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Reviews
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : isEdit ? 'Update Review' : 'Publish Review'}
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
          Review Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Review Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={handleTitleChange}
              placeholder="e.g. Sony WH-1000XM5 In-Depth Review: The ANC King?"
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
              placeholder="sony-wh-1000xm5-review"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm font-mono text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Linked Product (Optional)
            </label>
            <select
              value={formData.product || ''}
              onChange={handleProductSelect}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm bg-white"
            >
              <option value="">
                {loadingProducts ? 'Loading products...' : '-- None / Custom Product --'}
              </option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Product Display Name</label>
            <input
              type="text"
              value={formData.productName}
              onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
              placeholder="Sony WH-1000XM5"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Author</label>
            <input
              type="text"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              placeholder="Tech Review Team"
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
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Excerpt / Summary</label>
          <textarea
            rows={3}
            value={formData.excerpt}
            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
            placeholder="Quick 2-3 sentence overview of this hands-on test..."
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Final Verdict</label>
          <textarea
            rows={3}
            value={formData.verdict}
            onChange={(e) => setFormData({ ...formData, verdict: e.target.value })}
            placeholder="The definitive conclusion: Who is this product best for?"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Full Review Content</label>
          <textarea
            rows={10}
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="Detailed review sections (Design, Audio Quality, ANC, Battery, Verdict)..."
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

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-3">
          Pros & Cons
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
              placeholder="Exceptional active noise cancellation&#10;Crisp high-res audio profile&#10;Multipoint Bluetooth connectivity"
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
              placeholder="High price tag&#10;Bulky travel case&#10;No IP water resistance rating"
              className="w-full px-4 py-2 border border-rose-200 bg-rose-50/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm"
            />
          </div>
        </div>
      </div>
    </form>
  );
};
