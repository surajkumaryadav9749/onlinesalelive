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
  Newspaper,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';

interface ArticleItem {
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

export default function AdminBlogPage() {
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const res = await fetch('/api/articles?limit=100');
        const data = await res.json();
        if (!ignore && data.success && Array.isArray(data.data)) {
          setArticles(data.data);
        }
      } catch (err) {
        console.error('Failed to load articles', err);
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
    if (!confirm(`Are you sure you want to delete article: "${title}"?`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/articles/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setArticles((prev) => prev.filter((a) => a._id !== id));
      } else {
        alert(data.message || 'Failed to delete article');
      }
    } catch {
      alert('Error deleting article');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase()) ||
      a.author.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Blog & Articles"
        subtitle={`Total Articles: ${articles.length}`}
        actionLabel="Write Article"
        actionHref="/admin/blog/new"
      />

      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search articles by title, category, author..."
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
            Loading articles...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Newspaper className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-900">No articles found</h3>
            <p className="text-sm text-slate-500 mt-1 mb-4">
              {search ? 'Try modifying your search term.' : 'Get started by creating your first blog article.'}
            </p>
            <Link
              href="/admin/blog/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Article
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Article</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Author</th>
                  <th className="px-6 py-3">Read Time</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((article) => (
                  <tr key={article._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                          {article.image ? (
                            <Image
                              src={article.image}
                              alt={article.title}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          ) : (
                            <Newspaper className="w-6 h-6 text-slate-400 m-auto mt-3" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 truncate max-w-sm">{article.title}</p>
                          <p className="text-xs text-slate-400 font-mono truncate">/{article.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-600">{article.category}</td>
                    <td className="px-6 py-4 text-xs text-slate-600">{article.author}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">{article.readTime}</td>
                    <td className="px-6 py-4">
                      {article.isPublished ? (
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
                          href={`/blog/${article.slug}`}
                          target="_blank"
                          className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                          title="View on site"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/admin/blog/${article._id}`}
                          className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                          title="Edit article"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(article._id, article.title)}
                          disabled={deletingId === article._id}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors disabled:opacity-50"
                          title="Delete article"
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
