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
  Flame,
  CheckCircle,
  XCircle,
  Tag,
  Loader2,
} from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';

interface DealItem {
  _id: string;
  title: string;
  slug: string;
  image: string;
  currentPrice: number;
  originalPrice: number;
  discountPercent: number;
  marketplace: string;
  dealType: string;
  status: string;
  isFeatured: boolean;
  isAffiliate?: boolean;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}

export default function AdminDealsPage() {
  const [deals, setDeals] = useState<DealItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [marketplaceFilter, setMarketplaceFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const res = await fetch('/api/deals?all=true&limit=100');
        const data = await res.json();
        if (!ignore && data.success && Array.isArray(data.data)) {
          setDeals(data.data);
        }
      } catch (err) {
        console.error('Failed to load deals', err);
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
    if (!confirm(`Are you sure you want to delete the deal: "${title}"?`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/deals/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setDeals((prev) => prev.filter((d) => d._id !== id));
      } else {
        alert(data.message || 'Failed to delete deal');
      }
    } catch {
      alert('Error deleting deal');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = deals.filter((d) => {
    const matchesSearch =
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.marketplace.toLowerCase().includes(search.toLowerCase()) ||
      d.dealType.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'inactive'
        ? !d.isActive
        : d.status?.toLowerCase() === statusFilter.toLowerCase();
    const matchesMarketplace =
      marketplaceFilter === 'all' ||
      d.marketplace.toLowerCase() === marketplaceFilter.toLowerCase();
    const matchesType =
      typeFilter === 'all' || d.dealType.toLowerCase() === typeFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesMarketplace && matchesType;
  });

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Deals Management"
        subtitle={`Total Deals: ${deals.length} | Showing: ${filtered.length}`}
        actionLabel="Create Deal"
        actionHref="/admin/deals/new"
      />

      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search deals by title, store, or type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="upcoming">Upcoming</option>
            <option value="expired">Expired</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={marketplaceFilter}
            onChange={(e) => setMarketplaceFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 font-medium"
          >
            <option value="all">All Stores</option>
            <option value="Amazon">Amazon</option>
            <option value="Flipkart">Flipkart</option>
            <option value="Myntra">Myntra</option>
            <option value="AJIO">AJIO</option>
            <option value="Meesho">Meesho</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 font-medium"
          >
            <option value="all">All Deal Types</option>
            <option value="Today's Deal">Today&apos;s Deal</option>
            <option value="Sale">Sale</option>
            <option value="Major Discount">Major Discount</option>
            <option value="Flash Deal">Flash Deal</option>
            <option value="Featured Deal">Featured Deal</option>
            <option value="Price Drop">Price Drop</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-rose-600" />
            Loading deals...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Tag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-900">No deals found</h3>
            <p className="text-sm text-slate-500 mt-1 mb-4">
              {search ? 'Try modifying your search term.' : 'Get started by publishing your first deal.'}
            </p>
            <Link
              href="/admin/deals/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Deal
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Deal</th>
                  <th className="px-6 py-3">Store</th>
                  <th className="px-6 py-3">Price & Discount</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((deal) => (
                  <tr key={deal._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                          {deal.image ? (
                            <Image
                              src={deal.image}
                              alt={deal.title}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          ) : (
                            <Tag className="w-6 h-6 text-slate-400 m-auto mt-3" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 truncate max-w-xs">{deal.title}</p>
                          <p className="text-xs text-slate-400 font-mono truncate">/{deal.slug}</p>
                          {deal.isFeatured && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-medium mt-0.5">
                              <Flame className="w-3 h-3" /> Featured
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-800">{deal.marketplace}</span>
                        {deal.isAffiliate && (
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200">
                            Affiliate
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-baseline gap-2">
                        <span className="font-semibold text-slate-900">
                          ₹{deal.currentPrice.toLocaleString('en-IN')}
                        </span>
                        {deal.originalPrice > deal.currentPrice && (
                          <span className="text-xs text-slate-400 line-through">
                            ₹{deal.originalPrice.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-emerald-600">
                        {deal.discountPercent}% OFF
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-600">{deal.dealType}</td>
                    <td className="px-6 py-4">
                      {!deal.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          <XCircle className="w-3.5 h-3.5" /> Inactive
                        </span>
                      ) : deal.status === 'upcoming' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          Upcoming
                        </span>
                      ) : deal.status === 'expired' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          Expired
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="w-3.5 h-3.5" /> Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/deals`}
                          target="_blank"
                          className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                          title="View on site"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/admin/deals/${deal._id}`}
                          className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                          title="Edit deal"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(deal._id, deal.title)}
                          disabled={deletingId === deal._id}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors disabled:opacity-50"
                          title="Delete deal"
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
