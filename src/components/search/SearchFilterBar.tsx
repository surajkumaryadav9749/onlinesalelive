'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Filter, RotateCcw, ArrowUpDown, X } from 'lucide-react';

interface SearchFilterBarProps {
  categories: { slug: string; name: string }[];
  totalResults: number;
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  categories,
  totalResults,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentQ = searchParams.get('q') || '';
  const currentCategory = searchParams.get('category') || '';
  const currentMarketplace = searchParams.get('marketplace') || '';
  const currentMinPrice = searchParams.get('minPrice') || '';
  const currentMaxPrice = searchParams.get('maxPrice') || '';
  const currentMinDiscount = searchParams.get('minDiscount') || '';
  const currentSort = searchParams.get('sort') || 'relevance';

  const updateParams = (newParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    // Reset page to 1 whenever a filter/sort changes
    if (!('page' in newParams)) {
      params.delete('page');
    }

    Object.entries(newParams).forEach(([key, val]) => {
      if (val === null || val === undefined || val === '') {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    });

    router.push(`/search?${params.toString()}`);
  };

  const handleResetFilters = () => {
    const params = new URLSearchParams();
    if (currentQ) {
      params.set('q', currentQ);
    }
    router.push(`/search?${params.toString()}`);
  };

  const hasActiveFilters = Boolean(
    currentCategory ||
    currentMarketplace ||
    currentMinPrice ||
    currentMaxPrice ||
    currentMinDiscount ||
    (currentSort && currentSort !== 'relevance')
  );

  const marketplaces = ['Amazon', 'Flipkart', 'Myntra', 'AJIO', 'Meesho'];
  const discounts = [10, 20, 30, 50, 70];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-4">
      {/* Top summary row: result count + active filters + sort */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-orange-600 shrink-0" />
          <span className="font-bold text-slate-900 text-sm">
            Refine Results
          </span>
          <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full">
            {totalResults} {totalResults === 1 ? 'item' : 'items'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition-colors"
            >
              <RotateCcw size={12} />
              <span>Reset Filters</span>
            </button>
          )}

          {/* Sort Selector */}
          <div className="flex items-center gap-2 ml-auto">
            <label htmlFor="search-sort" className="text-xs text-slate-500 flex items-center gap-1 shrink-0">
              <ArrowUpDown size={14} />
              <span className="hidden sm:inline">Sort:</span>
            </label>
            <select
              id="search-sort"
              value={currentSort}
              onChange={(e) => updateParams({ sort: e.target.value === 'relevance' ? null : e.target.value })}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="relevance">Relevance</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="discount_desc">Highest Discount</option>
              <option value="rating_desc">Top Customer Rating</option>
              <option value="newest">Newest Arrivals</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filter controls grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
        {/* Category Filter */}
        <div>
          <label htmlFor="filter-category" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Category
          </label>
          <select
            id="filter-category"
            value={currentCategory}
            onChange={(e) => updateParams({ category: e.target.value || null })}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Marketplace Filter */}
        <div>
          <label htmlFor="filter-marketplace" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Marketplace
          </label>
          <select
            id="filter-marketplace"
            value={currentMarketplace}
            onChange={(e) => updateParams({ marketplace: e.target.value || null })}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">All Marketplaces</option>
            {marketplaces.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Price Range Filter */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Price Range (₹)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min"
              min="0"
              value={currentMinPrice}
              onChange={(e) => updateParams({ minPrice: e.target.value ? e.target.value : null })}
              className="w-1/2 text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <span className="text-slate-400 text-xs">-</span>
            <input
              type="number"
              placeholder="Max"
              min="0"
              value={currentMaxPrice}
              onChange={(e) => updateParams({ maxPrice: e.target.value ? e.target.value : null })}
              className="w-1/2 text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Minimum Discount Filter */}
        <div>
          <label htmlFor="filter-discount" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Min Discount
          </label>
          <select
            id="filter-discount"
            value={currentMinDiscount}
            onChange={(e) => updateParams({ minDiscount: e.target.value || null })}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">Any Discount</option>
            {discounts.map((d) => (
              <option key={d} value={d}>
                {d}% or more
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Filter Badges */}
      {hasActiveFilters && (
        <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-slate-100">
          <span className="text-[11px] font-semibold text-slate-400">Active filters:</span>
          {currentCategory && (
            <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 border border-orange-200 text-xs px-2.5 py-1 rounded-full font-medium">
              Category: {categories.find((c) => c.slug === currentCategory)?.name || currentCategory}
              <button onClick={() => updateParams({ category: null })} className="hover:text-orange-900" aria-label="Remove category filter">
                <X size={12} />
              </button>
            </span>
          )}
          {currentMarketplace && (
            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2.5 py-1 rounded-full font-medium">
              Store: {currentMarketplace}
              <button onClick={() => updateParams({ marketplace: null })} className="hover:text-blue-900" aria-label="Remove marketplace filter">
                <X size={12} />
              </button>
            </span>
          )}
          {(currentMinPrice || currentMaxPrice) && (
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2.5 py-1 rounded-full font-medium">
              ₹{currentMinPrice || '0'} - ₹{currentMaxPrice || '∞'}
              <button onClick={() => updateParams({ minPrice: null, maxPrice: null })} className="hover:text-emerald-900" aria-label="Remove price filter">
                <X size={12} />
              </button>
            </span>
          )}
          {currentMinDiscount && (
            <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-200 text-xs px-2.5 py-1 rounded-full font-medium">
              {currentMinDiscount}%+ Off
              <button onClick={() => updateParams({ minDiscount: null })} className="hover:text-purple-900" aria-label="Remove discount filter">
                <X size={12} />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};
