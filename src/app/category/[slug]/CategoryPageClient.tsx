'use client';

import React, { useState, useMemo } from 'react';
import { Category, Product, FilterOptions, SortOption } from '@/types';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { ProductGrid } from '@/components/products/ProductGrid';
import { ProductFilters } from '@/components/products/ProductFilters';
import { ProductSort } from '@/components/products/ProductSort';
import { filterAndSortProducts } from '@/lib/filter-utils';
import { RelatedContentSection } from '@/components/content/RelatedContentSection';
import { RelatedContentResult } from '@/lib/data-service';
import { Layers } from 'lucide-react';

interface CategoryPageClientProps {
  category: Category;
  initialProducts: Product[];
  relatedContent?: RelatedContentResult;
}

export const CategoryPageClient: React.FC<CategoryPageClientProps> = ({
  category,
  initialProducts,
  relatedContent,
}) => {
  const [filters, setFilters] = useState<FilterOptions>({});
  const [sortBy, setSortBy] = useState<SortOption>('popular');

  const filteredProducts = useMemo(() => {
    return filterAndSortProducts(initialProducts, filters, sortBy);
  }, [initialProducts, filters, sortBy]);

  const handleResetFilters = () => {
    setFilters({});
    setSortBy('popular');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Categories', href: '/categories' },
          { label: category.name },
        ]}
      />

      {/* Category Hero */}
      <div className="bg-linear-to-r from-slate-900 to-slate-800 text-white rounded-3xl p-6 sm:p-10 shadow-lg">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
            <Layers size={14} />
            <span>Category Hub</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-2">
            {category.name} Deals & Offers
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            {category.description}
          </p>
        </div>
      </div>

      {/* Main Layout: Filters + Product Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Left Filter Sidebar */}
        <div className="lg:col-span-1">
          <ProductFilters
            filters={filters}
            onChange={setFilters}
            onReset={handleResetFilters}
            showCategoryFilter={false}
          />
        </div>

        {/* Right Listing */}
        <div className="lg:col-span-3 space-y-4">
          <ProductSort
            currentSort={sortBy}
            onChange={setSortBy}
            totalCount={filteredProducts.length}
          />
          <ProductGrid
            products={filteredProducts}
            emptyMessage={`No products found in ${category.name} matching your filter options.`}
          />
        </div>
      </div>

      {/* Category Discovery: Guides, Reviews, Comparisons, Deals */}
      {relatedContent && (
        <RelatedContentSection
          title={`${category.name} Buying Advice & Handpicked Deals`}
          subtitle={`Explore tested buying guides, editorial evaluations, and active deals in ${category.name}`}
          guides={relatedContent.guides}
          reviews={relatedContent.reviews}
          comparisons={relatedContent.comparisons}
          deals={relatedContent.deals}
        />
      )}
    </div>
  );
};
