'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { HomepageDiscoveryData, DiscountCategoryItem, BudgetTierItem, DiscoveryCategoryItem } from '@/types';
import {
  Flame,
  IndianRupee,
  Layers,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShoppingBag,
  Tv,
  Smartphone,
  Laptop,
  Shirt,
  Footprints,
  Home,
  Watch,
  Headphones,
  Tag,
} from 'lucide-react';

const categoryIconMap: Record<string, React.ElementType> = {
  Tv,
  Smartphone,
  Laptop,
  Shirt,
  Footprints,
  Sparkles,
  Home,
  Watch,
  Headphones,
  ShoppingBag,
  Tag,
};

interface HomeDealsBudgetCategoriesProps {
  data: HomepageDiscoveryData;
}

/**
 * Resilient image renderer with fallback to icon if URL is missing or fails to load
 */
const DiscoveryImage: React.FC<{
  src?: string;
  alt: string;
  fallbackIcon: React.ReactNode;
  sizes: string;
  objectFit?: 'cover' | 'contain';
}> = ({ src, alt, fallbackIcon, sizes, objectFit = 'cover' }) => {
  const [hasError, setHasError] = useState(false);
  const trimmed = src && src.trim() !== '' ? src.trim() : null;

  if (!trimmed || hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        {fallbackIcon}
      </div>
    );
  }

  return (
    <Image
      src={trimmed}
      alt={alt}
      fill
      sizes={sizes}
      onError={() => setHasError(true)}
      className={`${objectFit === 'cover' ? 'object-cover' : 'object-contain p-2'} group-hover:scale-105 transition-transform duration-300 rounded-xl`}
    />
  );
};

/**
 * Helper component for scrollable shelf with desktop navigation arrows
 */
const ShelfContainer: React.FC<{
  children: React.ReactNode;
  ariaLabel: string;
}> = ({ children, ariaLabel }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const offset = direction === 'left' ? -340 : 340;
    scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    setTimeout(checkScroll, 350);
  };

  return (
    <div className="relative group/shelf">
      {/* Scroll Left Button */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scroll('left')}
          aria-label={`Scroll ${ariaLabel} left`}
          className="hidden md:flex absolute -left-3.5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 items-center justify-center rounded-full bg-white text-slate-700 shadow-md border border-slate-200 hover:bg-orange-50 hover:text-orange-600 transition-all cursor-pointer"
        >
          <ChevronLeft size={20} />
        </button>
      )}

      {/* Scrollable Row */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-3.5 sm:gap-4 overflow-x-auto pb-4 pt-1 px-1 scrollbar-none snap-x snap-mandatory scroll-smooth"
        tabIndex={0}
        role="region"
        aria-label={ariaLabel}
      >
        {children}
      </div>

      {/* Scroll Right Button */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scroll('right')}
          aria-label={`Scroll ${ariaLabel} right`}
          className="hidden md:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 items-center justify-center rounded-full bg-white text-slate-700 shadow-md border border-slate-200 hover:bg-orange-50 hover:text-orange-600 transition-all cursor-pointer"
        >
          <ChevronRight size={20} />
        </button>
      )}
    </div>
  );
};

export const HomeDealsBudgetCategories: React.FC<HomeDealsBudgetCategoriesProps> = ({ data }) => {
  const { discountCategories = [], budgetTiers = [], categories = [] } = data || {};

  // If there's no data at all, return null
  if (discountCategories.length === 0 && budgetTiers.length === 0 && categories.length === 0) {
    return null;
  }

  return (
    <section
      className="space-y-10 sm:space-y-12"
      aria-label="Shop by Deals, Budget & Categories"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-orange-100/90 text-orange-800 border border-orange-200 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
            <Sparkles size={13} className="text-orange-600" />
            <span>Curated Discovery</span>
          </div>
          <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
            Shop by Deals, Budget & Categories
          </div>
          <p className="mt-1.5 text-sm sm:text-base text-slate-600">
            Handpicked discovery shelves to find steep discounts, pocket-friendly budget deals, and all top categories.
          </p>
        </div>
      </div>

      {/* ==================================================== */}
      {/* ROW 1: 50%+ OFF CATEGORIES                           */}
      {/* ==================================================== */}
      {discountCategories.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shadow-2xs">
                <Flame size={18} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  50%+ Off Categories
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Categories with verified active deals at half-price or more
                </p>
              </div>
            </div>
            <Link
              href="/products?minDiscount=50"
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-orange-600 hover:text-orange-700 hover:underline transition-colors shrink-0"
            >
              <span>View All 50%+ Deals</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <ShelfContainer ariaLabel="50%+ Off Categories">
            {discountCategories.map((item: DiscountCategoryItem) => {
              const IconComp = categoryIconMap[item.icon || ''] || Tv;
              return (
                <Link
                  key={item.slug}
                  href={`/products?category=${item.slug}&minDiscount=50`}
                  className="group relative shrink-0 w-44 sm:w-52 bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-2xs hover:shadow-lg hover:border-red-400 hover:-translate-y-1 transition-all duration-200 snap-start flex flex-col justify-between overflow-hidden"
                  aria-label={`Shop ${item.name} with 50% or more discount (${item.count} deals)`}
                >
                  {/* Top Badge */}
                  <div className="flex items-center justify-between gap-1 mb-2.5">
                    <span className="inline-flex items-center gap-1 bg-red-600 text-white font-extrabold text-[11px] px-2 py-0.5 rounded-md shadow-2xs tracking-wide">
                      <Flame size={11} className="fill-white" />
                      50%+ Off
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {item.count} {item.count === 1 ? 'deal' : 'deals'}
                    </span>
                  </div>

                  {/* Representative Image Container */}
                  <div className="relative w-full h-32 sm:h-36 bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center p-2 mb-3">
                    <DiscoveryImage
                      src={item.image}
                      alt={`${item.name} 50%+ Off deals`}
                      sizes="(max-width: 640px) 176px, 208px"
                      fallbackIcon={
                        <div className="w-16 h-16 rounded-xl bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                          <IconComp size={32} />
                        </div>
                      }
                    />
                  </div>

                  {/* Category Details */}
                  <div className="pt-1 border-t border-slate-100 flex items-center justify-between">
                    <span className="font-bold text-slate-900 group-hover:text-red-600 transition-colors text-sm truncate">
                      {item.name}
                    </span>
                    <ArrowRight
                      size={14}
                      className="text-slate-400 group-hover:text-red-600 group-hover:translate-x-1 transition-all shrink-0 ml-1"
                    />
                  </div>
                </Link>
              );
            })}
          </ShelfContainer>
        </div>
      )}

      {/* ==================================================== */}
      {/* ROW 2: BUDGET CATEGORIES                             */}
      {/* ==================================================== */}
      {budgetTiers.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-2xs">
                <IndianRupee size={18} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Shop Under ₹299, ₹399, ₹499, ₹599, ₹699, ₹799 & ₹899
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Pocket-friendly deals matching verified current prices below each threshold
                </p>
              </div>
            </div>
          </div>

          <ShelfContainer ariaLabel="Shop by Budget">
            {budgetTiers.map((tier: BudgetTierItem) => (
              <Link
                key={tier.amount}
                href={tier.href}
                className="group relative shrink-0 w-36 sm:w-44 bg-linear-to-b from-white via-emerald-50/20 to-emerald-50/50 rounded-2xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-lg hover:border-emerald-500 hover:-translate-y-1 transition-all duration-200 snap-start flex flex-col justify-between overflow-hidden"
                aria-label={`Shop products under ₹${tier.amount} (${tier.count} items available)`}
              >
                {/* Background watermark icon */}
                <div className="absolute -right-3 -bottom-3 text-emerald-200/35 pointer-events-none group-hover:scale-110 group-hover:text-emerald-300/40 transition-transform duration-300">
                  <IndianRupee size={88} strokeWidth={1.5} />
                </div>

                {/* Graphic Header */}
                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-md">
                    Under
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {tier.count} {tier.count === 1 ? 'item' : 'items'}
                  </span>
                </div>

                {/* Big Budget Value Display */}
                <div className="relative z-10 my-4 text-center">
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 group-hover:text-emerald-700 transition-colors flex items-center justify-center">
                    <span>₹{tier.amount}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Budget Store
                  </div>
                </div>

                {/* Footer Action */}
                <div className="relative z-10 pt-2 border-t border-slate-200/70 flex items-center justify-between text-xs font-bold text-emerald-700 group-hover:text-emerald-800">
                  <span>Explore</span>
                  <ArrowRight
                    size={13}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </div>
              </Link>
            ))}
          </ShelfContainer>
        </div>
      )}

      {/* ==================================================== */}
      {/* ROW 3: ALL CATEGORIES                                */}
      {/* ==================================================== */}
      {categories.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shadow-2xs">
                <Layers size={18} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Shop by Category
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Explore all live product departments updated directly from our catalog
                </p>
              </div>
            </div>
            <Link
              href="/categories"
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-orange-600 hover:text-orange-700 hover:underline transition-colors shrink-0"
            >
              <span>All Categories</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <ShelfContainer ariaLabel="Shop by Category">
            {categories.map((cat: DiscoveryCategoryItem) => {
              const IconComp = categoryIconMap[cat.icon || ''] || ShoppingBag;
              return (
                <Link
                  key={cat.id || cat.slug}
                  href={`/products?category=${cat.slug}`}
                  className="group relative shrink-0 w-36 sm:w-44 bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-2xs hover:shadow-lg hover:border-orange-400 hover:-translate-y-1 transition-all duration-200 snap-start flex flex-col justify-between overflow-hidden"
                  aria-label={`Browse ${cat.name} deals`}
                >
                  {/* Category Visual */}
                  <div className="relative w-full h-24 sm:h-28 bg-orange-50/60 rounded-xl overflow-hidden flex items-center justify-center p-2 mb-2.5">
                    <DiscoveryImage
                      src={cat.image}
                      alt={cat.name}
                      sizes="(max-width: 640px) 144px, 176px"
                      fallbackIcon={
                        <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-orange-600 group-hover:text-white transition-all duration-200 shadow-2xs">
                          <IconComp size={24} />
                        </div>
                      }
                    />
                  </div>

                  {/* Name and Count */}
                  <div>
                    <h3 className="font-bold text-slate-900 group-hover:text-orange-600 transition-colors text-sm truncate text-center">
                      {cat.name}
                    </h3>
                    {cat.itemCount !== undefined && cat.itemCount > 0 && (
                      <p className="text-[11px] text-slate-500 font-medium text-center mt-0.5">
                        {cat.itemCount}+ Deals
                      </p>
                    )}
                  </div>

                  {/* Subtle bottom indicator */}
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-center text-[11px] font-semibold text-slate-600 group-hover:text-orange-600 transition-colors">
                    <span className="flex items-center gap-1">
                      Browse
                      <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </ShelfContainer>
        </div>
      )}
    </section>
  );
};
