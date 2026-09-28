'use client';

import React from 'react';
import { SortOption } from '@/types';
import { ArrowUpDown } from 'lucide-react';

interface ProductSortProps {
  currentSort: SortOption;
  onChange: (sort: SortOption) => void;
  totalCount: number;
}

export const ProductSort: React.FC<ProductSortProps> = ({
  currentSort,
  onChange,
  totalCount,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3 sm:px-4 rounded-xl border border-slate-200 shadow-2xs mb-6">
      <div className="text-xs sm:text-sm text-slate-600">
        Showing <span className="font-bold text-slate-900">{totalCount}</span> results
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        <label htmlFor="sort-select" className="text-xs text-slate-500 flex items-center gap-1 shrink-0">
          <ArrowUpDown size={14} />
          <span>Sort by:</span>
        </label>
        <select
          id="sort-select"
          value={currentSort}
          onChange={(e) => onChange(e.target.value as SortOption)}
          aria-label="Sort products by"
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 w-full sm:w-auto"
        >
          <option value="popular">Most Popular</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="discount-desc">Highest Discount</option>
          <option value="rating-desc">Highest Rated</option>
          <option value="newest">Newest Deals</option>
          <option value="oldest">Oldest</option>
        </select>
      </div>
    </div>
  );
};
