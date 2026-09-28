'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Edit2, Trash2, Package, Search, AlertCircle, CheckCircle2, Star } from 'lucide-react';

interface ProductItem {
  _id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  categorySlug: string;
  category?: { name: string; slug: string };
  dealType: string;
  rating: number;
  isFeatured: boolean;
  isActive: boolean;
  marketplaces?: Array<{ name: string; price: number | null; inStock: boolean }>;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const res = await fetch('/api/products?all=true&limit=200');
        const data = await res.json();
        if (!ignore) {
          if (data.success) {
            setProducts(data.data);
          } else {
            setError(data.error || 'Failed to load products');
          }
        }
      } catch {
        if (!ignore) setError('Network error loading products');
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    void load();
    return () => {
      ignore = true;
    };
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete product "${name}"?`)) {
      return;
    }

    setDeletingId(id);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to delete product');
      } else {
        setSuccess(`Product "${name}" deleted successfully`);
        setProducts((prev) => prev.filter((p) => p._id !== id));
      }
    } catch {
      setError('Network error deleting product');
    } finally {
      setDeletingId(null);
    }
  };

  const categories = Array.from(new Set(products.map((p) => p.categorySlug || 'general')));

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      categoryFilter === 'all' || p.categorySlug === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Products Management"
        subtitle="Manage product listings, cross-store prices, specifications, and deals"
        actionText="Add Product"
        actionHref="/admin/products/new"
      />

      <div className="p-6 max-w-7xl mx-auto space-y-4">
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200">
          <div className="relative flex-1 w-full max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search products by name or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white text-slate-900"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c.toUpperCase()}
                </option>
              ))}
            </select>
            <div className="text-xs text-slate-500 font-semibold px-2 whitespace-nowrap">
              {filtered.length} products
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400">Loading products...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-500 space-y-2">
              <Package size={32} className="mx-auto text-slate-300" />
              <p>No products match your criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Deal Type</th>
                    <th className="py-3 px-4">Rating</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((prod) => (
                    <tr key={prod._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 leading-snug line-clamp-1">
                          {prod.name}
                        </div>
                        <div className="font-mono text-[10px] text-slate-400">{prod.slug}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-medium capitalize">
                          {prod.category?.name || prod.categorySlug || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-black text-slate-900">
                          ₹{prod.price.toLocaleString('en-IN')}
                        </span>
                        {prod.originalPrice > prod.price && (
                          <span className="text-[10px] text-slate-400 line-through block">
                            ₹{prod.originalPrice.toLocaleString('en-IN')}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-orange-50 text-orange-700 border border-orange-200 text-[10px] font-bold px-2 py-0.5 rounded">
                          {prod.dealType}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 font-semibold text-slate-700">
                          <Star size={12} className="text-amber-500 fill-amber-500" />
                          <span>{prod.rating}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            prod.isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {prod.isActive ? 'Active' : 'Draft'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/products/${prod._id}`}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </Link>
                          <button
                            onClick={() => handleDelete(prod._id, prod.name)}
                            disabled={deletingId === prod._id}
                            className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
