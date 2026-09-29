'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import { PRODUCT_DISCOUNT_OPTIONS, matchesDiscountRange } from '@/lib/filter-utils';
import { ProductCard } from '@/components/products/ProductCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Percent, ArrowRight, Sparkles } from 'lucide-react';

interface HomeDiscountDiscoveryProps {
  products: Product[];
}

export const HomeDiscountDiscovery: React.FC<HomeDiscountDiscoveryProps> = ({ products }) => {
  // Start with 50% OFF by default if products exist, or null (All Discounts)
  const [selectedDiscount, setSelectedDiscount] = useState<number | null>(50);

  // Compute product counts for each discount tier from available products
  const countsByTier = useMemo(() => {
    const map: Record<number, number> = {};
    for (const opt of PRODUCT_DISCOUNT_OPTIONS) {
      map[opt.value] = products.filter((p) => matchesDiscountRange(p.discountPercent, opt.value)).length;
    }
    return map;
  }, [products]);

  // Filtered products based on selected tier
  const displayedProducts = useMemo(() => {
    if (selectedDiscount === null) {
      // Show products with active discounts (>= 10%), sorted highest discount first
      return products
        .filter((p) => p.discountPercent >= 10)
        .sort((a, b) => b.discountPercent - a.discountPercent)
        .slice(0, 8);
    }
    return products
      .filter((p) => matchesDiscountRange(p.discountPercent, selectedDiscount))
      .sort((a, b) => b.discountPercent - a.discountPercent)
      .slice(0, 8);
  }, [products, selectedDiscount]);

  const activeLabel = selectedDiscount !== null
    ? PRODUCT_DISCOUNT_OPTIONS.find((o) => o.value === selectedDiscount)?.label || `${selectedDiscount}% OFF`
    : 'All Active Discounts';

  return (
    <section className="bg-slate-50/70 p-6 sm:p-8 rounded-3xl border border-slate-200/80 space-y-6">
      <SectionHeader
        title="Discover by Product Discount"
        subtitle="Filter verified Indian marketplace offers by strict discount percentage brackets without overlap"
        badge="Discount Filter"
        viewAllLink={selectedDiscount ? `/products?discount=${selectedDiscount}` : '/products'}
        viewAllText={selectedDiscount ? `View All ${activeLabel}` : 'View All Products'}
      />

      {/* Product Discount Pills Filter Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <Percent size={14} className="text-orange-600" />
            <span>Product Discount:</span>
          </div>
          {selectedDiscount !== null && (
            <button
              type="button"
              onClick={() => setSelectedDiscount(null)}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 self-start sm:self-auto cursor-pointer"
            >
              Reset to All Discounts
            </button>
          )}
        </div>

        {/* Horizontal scrollable row on mobile, wrapped on desktop */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 no-scrollbar sm:flex-wrap">
          <button
            type="button"
            onClick={() => setSelectedDiscount(null)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all shrink-0 cursor-pointer ${
              selectedDiscount === null
                ? 'bg-orange-600 text-white border-orange-600 font-bold shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
            }`}
          >
            All Discounts
          </button>

          {PRODUCT_DISCOUNT_OPTIONS.map((opt) => {
            const isSelected = selectedDiscount === opt.value;
            const count = countsByTier[opt.value] || 0;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelectedDiscount(isSelected ? null : opt.value)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-orange-600 text-white border-orange-600 font-bold shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                }`}
              >
                <span>{opt.label}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected
                        ? 'bg-white/25 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filtered Products Grid */}
      {displayedProducts.length > 0 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {displayedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="pt-2 flex justify-center">
            <Link
              href={selectedDiscount ? `/products?discount=${selectedDiscount}` : '/products'}
              className="inline-flex items-center gap-2 text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-5 py-2.5 rounded-xl transition-colors shadow-2xs"
            >
              <span>Explore all {activeLabel} products in catalog</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3 shadow-2xs">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
            <Sparkles size={20} />
          </div>
          <h4 className="font-bold text-slate-900 text-sm">
            No products currently in the {activeLabel} range
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Our catalog is continuously refreshed with verified deals. Try selecting another discount tier or browse the complete product catalog.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => setSelectedDiscount(null)}
              className="text-xs font-bold text-orange-600 hover:underline cursor-pointer"
            >
              Show all active discounts
            </button>
            <span className="text-slate-300">|</span>
            <Link href="/products" className="text-xs font-bold text-slate-700 hover:text-slate-900">
              Browse full catalog
            </Link>
          </div>
        </div>
      )}
    </section>
  );
};
