'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AdminHeader } from '@/components/admin/AdminHeader';
import {
  Edit2,
  Trash2,
  Layers,
  Search,
  AlertCircle,
  CheckCircle2,
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

const categoryIconMap: Record<string, React.ElementType> = {
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

interface CategoryItem {
  _id: string;
  name: string;
  slug: string;
  icon: string;
  iconKey?: string;
  description: string;
  image?: string;
  imageUrl?: string;
  itemCount: number;
  featured: boolean;
  isActive: boolean;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const res = await fetch('/api/categories?all=true');
        const data = await res.json();
        if (!ignore) {
          if (data.success) {
            setCategories(data.data);
          } else {
            setError(data.error || 'Failed to load categories');
          }
        }
      } catch {
        if (!ignore) setError('Network error loading categories');
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
    if (!confirm(`Are you sure you want to delete category "${name}"? This cannot be undone.`)) {
      return;
    }

    setDeletingId(id);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to delete category');
      } else {
        setSuccess(`Category "${name}" deleted successfully`);
        setCategories((prev) => prev.filter((c) => c._id !== id));
      }
    } catch {
      setError('Network error while deleting category');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Category Taxonomy"
        subtitle="Manage product categories, slugs, and navigation badges"
        actionText="Add Category"
        actionHref="/admin/categories/new"
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
        <div className="flex items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search categories by name or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white text-slate-900"
            />
          </div>
          <div className="text-xs text-slate-500 font-semibold px-2">
            Total: {filtered.length} categories
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400">Loading categories...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-500 space-y-2">
              <Layers size={32} className="mx-auto text-slate-300" />
              <p>No categories found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 w-14">Image</th>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Slug</th>
                    <th className="py-3 px-4">Icon</th>
                    <th className="py-3 px-4">Items Count</th>
                    <th className="py-3 px-4">Featured</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((cat) => {
                    const imageSrc = cat.imageUrl || cat.image || '';
                    const IconComp = categoryIconMap[cat.iconKey || cat.icon] || Tv;

                    return (
                      <tr key={cat._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-2.5 px-4">
                          {imageSrc ? (
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 shrink-0 shadow-2xs">
                              <Image
                                src={imageSrc}
                                alt={cat.name}
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center shrink-0 shadow-2xs" title={`Icon: ${cat.icon}`}>
                              <IconComp size={18} />
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">{cat.name}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{cat.slug}</td>
                      <td className="py-3 px-4">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono text-[10px]">
                          {cat.icon}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{cat.itemCount}</td>
                      <td className="py-3 px-4">
                        {cat.featured ? (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">
                            Featured
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            cat.isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {cat.isActive ? 'Active' : 'Draft'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/categories/${cat._id}`}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </Link>
                          <button
                            onClick={() => handleDelete(cat._id, cat.name)}
                            disabled={deletingId === cat._id}
                            className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
