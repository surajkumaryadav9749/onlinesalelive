'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ExternalLink,
  BookOpen,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';

interface GuideItem {
  _id: string;
  title: string;
  slug: string;
  category: string;
  author: string;
  readTime: string;
  image: string;
  isPublished: boolean;
  publishedAt: string;
}

export default function AdminGuidesPage() {
  const [guides, setGuides] = useState<GuideItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const res = await fetch('/api/guides?limit=100');
        const data = await res.json();
        if (!ignore && data.success && Array.isArray(data.data)) {
          setGuides(data.data);
        }
      } catch (err) {
        console.error('Failed to load guides', err);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    void load();
    return () => {
      ignore = true;
    };
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete guide: "${title}"?`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/guides/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setGuides((prev) => prev.filter((g) => g._id !== id));
      } else {
        alert(data.message || 'Failed to delete guide');
      }
    } catch {
      alert('Error deleting guide');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = guides.filter(
    (g) =>
      g.title.toLowerCase().includes(search.toLowerCase()) ||
      g.category.toLowerCase().includes(search.toLowerCase()) ||
      g.author.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Buying Guides"
        subtitle={`Total Guides: ${guides.length}`}
        actionLabel="Write Guide"
        actionHref="/admin/guides/new"
      />

      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search guides by title, category, author..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-rose-600" />
            Loading guides...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-900">No guides found</h3>
            <p className="text-sm text-slate-500 mt-1 mb-4">
              {search ? 'Try modifying your search term.' : 'Get started by creating your first in-depth buyer guide.'}
            </p>
            <Link
              href="/admin/guides/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Guide
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Guide</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Author</th>
                  <th className="px-6 py-3">Read Time</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((guide) => (
                  <tr key={guide._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                          {guide.image ? (
                            <Image
                              src={guide.image}
                              alt={guide.title}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          ) : (
                            <BookOpen className="w-6 h-6 text-slate-400 m-auto mt-3" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 truncate max-w-sm">{guide.title}</p>
                          <p className="text-xs text-slate-400 font-mono truncate">/{guide.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-600">{guide.category}</td>
                    <td className="px-6 py-4 text-xs text-slate-600">{guide.author}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">{guide.readTime}</td>
                    <td className="px-6 py-4">
                      {guide.isPublished ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="w-3.5 h-3.5" /> Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          <XCircle className="w-3.5 h-3.5" /> Draft
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/guides/${guide.slug}`}
                          target="_blank"
                          className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                          title="View on site"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/admin/guides/${guide._id}`}
                          className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                          title="Edit guide"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(guide._id, guide.title)}
                          disabled={deletingId === guide._id}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors disabled:opacity-50"
                          title="Delete guide"
                        >
                          <Trash2 className="w-4 h-4" />
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
  );
}
