'use client';

import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Product, Category, FilterOptions, SortOption } from '@/types';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { ProductGrid } from '@/components/products/ProductGrid';
import { ProductFilters } from '@/components/products/ProductFilters';
import { ProductSort } from '@/components/products/ProductSort';
import { filterAndSortProducts } from '@/lib/filter-utils';
import { ShoppingBag, Search } from 'lucide-react';

interface ProductsPageClientProps {
  initialProducts: Product[];
  categories: Category[];
}

export const ProductsPageClient: React.FC<ProductsPageClientProps> = ({
  initialProducts,
  categories,
}) => {
  const searchParams = useSearchParams();

  // Read discount from URL parameter if present
  const urlDiscount = searchParams.get('discount');
  const initialDiscount = useMemo(() => {
    if (!urlDiscount) return undefined;
    const num = parseInt(urlDiscount, 10);
    return isNaN(num) ? undefined : num;
  }, [urlDiscount]);

  const [filters, setFilters] = useState<FilterOptions>(() => ({
    discountRange: initialDiscount,
  }));
  const [prevInitialDiscount, setPrevInitialDiscount] = useState(initialDiscount);

  // Sync if URL search params change externally (e.g. back/forward navigation)
  if (prevInitialDiscount !== initialDiscount) {
    setPrevInitialDiscount(initialDiscount);
    setFilters((prev) => ({ ...prev, discountRange: initialDiscount }));
  }

  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [searchTerm, setSearchTerm] = useState('');

  const handleFiltersChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (newFilters.discountRange !== undefined) {
        params.set('discount', String(newFilters.discountRange));
      } else {
        params.delete('discount');
      }
      const newQuery = params.toString();
      const newPath = newQuery ? `${window.location.pathname}?${newQuery}` : window.location.pathname;
      window.history.replaceState(null, '', newPath);
    }
  };

  const filteredProducts = useMemo(() => {
    return filterAndSortProducts(
      initialProducts,
      { ...filters, searchQuery: searchTerm },
      sortBy
    );
  }, [initialProducts, filters, searchTerm, sortBy]);

  const handleResetFilters = () => {
    setFilters({});
    setSearchTerm('');
    setSortBy('popular');
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.delete('discount');
      const newQuery = params.toString();
      const newPath = newQuery ? `${window.location.pathname}?${newQuery}` : window.location.pathname;
      window.history.replaceState(null, '', newPath);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      <Breadcrumbs items={[{ label: 'Products' }]} />

      {/* Header */}
      <div className="bg-linear-to-r from-slate-900 via-slate-850 to-slate-800 text-white rounded-3xl p-6 sm:p-10 shadow-lg">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
            <ShoppingBag size={14} />
            <span>Complete Product Catalog</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-2">
            Explore All Products & Offers
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Filter by price, category, marketplace, and minimum discount to find the exact deal you want.
          </p>
        </div>
      </div>

      {/* Search Input Filter */}
      <div className="relative max-w-md">
        <Search
          size={18}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          placeholder="Filter products in real-time..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-2xs"
        />
      </div>

      {/* Main Grid with Sidebar Filter */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        <div className="lg:col-span-1">
          <ProductFilters
            filters={filters}
            onChange={handleFiltersChange}
            onReset={handleResetFilters}
            availableCategories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
            showCategoryFilter={true}
          />
        </div>

        <div className="lg:col-span-3 space-y-4">
          <ProductSort
            currentSort={sortBy}
            onChange={setSortBy}
            totalCount={filteredProducts.length}
          />
          <ProductGrid
            products={filteredProducts}
            emptyMessage="No products match your current filters. Try changing or clearing filters."
          />
        </div>
      </div>
    </div>
  );
};
