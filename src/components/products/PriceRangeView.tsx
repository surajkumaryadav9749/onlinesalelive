'use client';

import React, { useState, useMemo } from 'react';
import { Product, Guide, Category, SortOption, FilterOptions } from '@/types';
import { ProductGrid } from '@/components/products/ProductGrid';
import { ProductFilters } from '@/components/products/ProductFilters';
import { ProductSort } from '@/components/products/ProductSort';
import { GuideCard } from '@/components/guides/GuideCard';
import { CategoryCard } from '@/components/categories/CategoryCard';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { filterAndSortProducts } from '@/lib/filter-utils';
import { Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface PriceRangeViewProps {
  maxPrice: number;
  title: string;
  subtitle: string;
  introText: string;
  initialProducts: Product[];
  relatedGuides: Guide[];
  relatedCategories: Category[];
}

export const PriceRangeView: React.FC<PriceRangeViewProps> = ({
  maxPrice,
  title,
  subtitle,
  introText,
  initialProducts,
  relatedGuides,
  relatedCategories,
}) => {
  const [filters, setFilters] = useState<FilterOptions>({
    maxPrice: maxPrice,
  });
  const [sortBy, setSortBy] = useState<SortOption>('popular');

  const filteredProducts = useMemo(() => {
    return filterAndSortProducts(initialProducts, filters, sortBy);
  }, [initialProducts, filters, sortBy]);

  const handleResetFilters = () => {
    setFilters({ maxPrice: maxPrice });
    setSortBy('popular');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Products', href: '/products' },
          { label: title },
        ]}
      />

      {/* Header Banner */}
      <div className="bg-linear-to-r from-slate-900 to-slate-800 text-white rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
        <div className="max-w-3xl relative z-10">
          <div className="inline-flex items-center gap-2 bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
            <Sparkles size={14} />
            <span>Curated Budget Showcase</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-2">
            {title}
          </h1>
          {subtitle && (
            <p className="text-orange-300 text-sm font-medium mb-2">
              {subtitle}
            </p>
          )}
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-4">
            {introText}
          </p>

          {/* Quick budget switcher */}
          <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
            <span className="text-slate-400">Other Budgets:</span>
            {[500, 1000, 2000, 5000].map((price) => (
              <Link
                key={price}
                href={`/products-under-${price}`}
                className={`px-3 py-1 rounded-full border transition-colors ${
                  price === maxPrice
                    ? 'bg-orange-600 text-white border-orange-600 font-bold'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                Under ₹{price}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content with Sidebar Filter */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Sidebar Filters */}
        <div className="lg:col-span-1">
          <ProductFilters
            filters={filters}
            onChange={setFilters}
            onReset={handleResetFilters}
          />
        </div>

        {/* Product Grid Area */}
        <div className="lg:col-span-3 space-y-4">
          <ProductSort
            currentSort={sortBy}
            onChange={setSortBy}
            totalCount={filteredProducts.length}
          />
          <ProductGrid
            products={filteredProducts}
            emptyMessage={`No products found under ₹${maxPrice} matching your selected filters.`}
          />
        </div>
      </div>

      {/* Related Buying Guides */}
      {relatedGuides.length > 0 && (
        <section className="pt-8 border-t border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Related Buying Guides & Advice
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Expert tips to help you get the absolute most value out of your money
              </p>
            </div>
            <Link
              href="/guides"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>All Guides</span>
              <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedGuides.map((guide) => (
              <GuideCard key={guide.id} guide={guide} />
            ))}
          </div>
        </section>
      )}

      {/* Related Categories */}
      {relatedCategories.length > 0 && (
        <section className="pt-6 border-t border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            Browse Popular Categories Under This Range
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {relatedCategories.map((cat) => (
              <CategoryCard key={cat.id} category={cat} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
