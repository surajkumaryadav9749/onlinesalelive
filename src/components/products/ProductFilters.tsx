'use client';

import React from 'react';
import { FilterOptions } from '@/types';
import { Filter, RotateCcw } from 'lucide-react';

interface ProductFiltersProps {
  filters: FilterOptions;
  onChange: (newFilters: FilterOptions) => void;
  onReset: () => void;
  availableCategories?: { slug: string; name: string }[];
  showCategoryFilter?: boolean;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  filters,
  onChange,
  onReset,
  availableCategories = [
    { slug: 'electronics', name: 'Electronics' },
    { slug: 'mobiles', name: 'Mobiles' },
    { slug: 'laptops', name: 'Laptops' },
    { slug: 'fashion', name: 'Fashion' },
    { slug: 'shoes', name: 'Shoes' },
    { slug: 'watches', name: 'Watches' },
    { slug: 'home', name: 'Home & Kitchen' },
    { slug: 'beauty', name: 'Beauty' },
  ],
  showCategoryFilter = true,
}) => {
  const marketplaces = ['Amazon', 'Flipkart', 'Myntra', 'AJIO', 'Meesho'];
  const discounts = [10, 20, 30, 50, 70];
  const dealTypes = ["Today's Deal", 'Sale', 'Major Discount', 'Flash Deal', 'Price Drop', 'Featured Deal'];

  const hasActiveFilters =
    filters.category ||
    filters.minDiscount ||
    filters.marketplace ||
    filters.dealType ||
    filters.rating ||
    filters.maxPrice;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-orange-600" />
          <h3 className="font-bold text-slate-900 text-sm">Filters</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors"
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Category Filter */}
      {showCategoryFilter && (
        <div>
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
            Category
          </h4>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            <button
              onClick={() => onChange({ ...filters, category: undefined })}
              className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                !filters.category
                  ? 'bg-orange-50 text-orange-700 font-bold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              All Categories
            </button>
            {availableCategories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => onChange({ ...filters, category: cat.slug })}
                className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                  filters.category === cat.slug
                    ? 'bg-orange-50 text-orange-700 font-bold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Minimum Discount */}
      <div>
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
          Min Discount
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {discounts.map((pct) => (
            <button
              key={pct}
              onClick={() =>
                onChange({
                  ...filters,
                  minDiscount: filters.minDiscount === pct ? undefined : pct,
                })
              }
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                filters.minDiscount === pct
                  ? 'bg-red-600 text-white border-red-600 font-bold'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              {pct}%+ OFF
            </button>
          ))}
        </div>
      </div>

      {/* Marketplaces */}
      <div>
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
          Marketplace
        </h4>
        <div className="space-y-1.5">
          {marketplaces.map((m) => (
            <label
              key={m}
              className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:text-slate-900"
            >
              <input
                type="radio"
                name="marketplace"
                checked={filters.marketplace === m}
                onChange={() =>
                  onChange({
                    ...filters,
                    marketplace: filters.marketplace === m ? undefined : m,
                  })
                }
                className="text-orange-600 focus:ring-orange-500 rounded-sm"
              />
              <span>{m}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Deal Type */}
      <div>
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
          Deal Type
        </h4>
        <div className="space-y-1.5">
          {dealTypes.map((type) => (
            <button
              key={type}
              onClick={() =>
                onChange({
                  ...filters,
                  dealType: filters.dealType === type ? undefined : type,
                })
              }
              className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                filters.dealType === type
                  ? 'bg-blue-50 text-blue-700 font-bold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div>
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
          Customer Rating
        </h4>
        <div className="flex gap-2">
          {[4.0, 4.5].map((stars) => (
            <button
              key={stars}
              onClick={() =>
                onChange({
                  ...filters,
                  rating: filters.rating === stars ? undefined : stars,
                })
              }
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                filters.rating === stars
                  ? 'bg-amber-500 text-white border-amber-500 font-bold'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              ★ {stars}+
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
