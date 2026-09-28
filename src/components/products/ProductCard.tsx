'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import { MarketplaceBadge } from '@/components/ui/MarketplaceBadge';
import { RatingStars } from '@/components/ui/RatingStars';
import { DealBadge } from '@/components/ui/DealBadge';
import { ArrowUpRight, GitCompare } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, priority = false }) => {
  const defaultPlaceholder = `https://placehold.co/600x400/f1f5f9/475569?text=${encodeURIComponent(
    (product.name || 'Product').slice(0, 18)
  )}`;
  const [imgSrc, setImgSrc] = useState(
    product.image && product.image.trim() !== '' ? product.image : defaultPlaceholder
  );

  // Find lowest price marketplace among active, in-stock offers
  const validMarketplaces = (product.marketplaces || []).filter(
    (m) => m.price !== null && m.inStock && m.isActive !== false
  );

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-lg hover:border-slate-300 transition-all duration-200 flex flex-col overflow-hidden">
      {/* Badges Top Bar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex flex-col gap-1 items-start">
          {product.discountPercent > 0 && (
            <span className="bg-red-600 text-white font-extrabold text-xs px-2 py-0.5 rounded-md shadow-sm">
              {product.discountPercent}% OFF
            </span>
          )}
          {product.badgeText && (
            <span className="bg-amber-500 text-white font-bold text-[10px] px-2 py-0.5 rounded shadow-sm">
              {product.badgeText}
            </span>
          )}
        </div>
        <div>
          <DealBadge type={product.dealType} size="sm" />
        </div>
      </div>

      {/* Image Area */}
      <Link
        href={`/product/${product.slug}`}
        className="relative block w-full pt-[80%] bg-slate-50 overflow-hidden"
      >
        <Image
          src={imgSrc || defaultPlaceholder}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          priority={priority}
          className="object-cover object-center group-hover:scale-105 transition-transform duration-300 p-2 rounded-xl"
          onError={() => {
            // Fallback placeholder if image load fails
            setImgSrc(defaultPlaceholder);
          }}
        />
      </Link>

      {/* Content Area */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Rating */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="font-medium uppercase tracking-wider text-[11px] text-orange-600">
              {product.category}
            </span>
            <RatingStars rating={product.rating} reviewCount={product.reviewCount} size="sm" />
          </div>

          {/* Title */}
          <Link href={`/product/${product.slug}`} className="block group-hover:text-blue-600">
            <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2 min-h-[2.5rem]">
              {product.name}
            </h3>
          </Link>

          {/* Pricing */}
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-lg font-extrabold text-slate-900">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {product.originalPrice > product.price && (
              <span className="text-xs text-slate-400 line-through">
                ₹{product.originalPrice.toLocaleString('en-IN')}
              </span>
            )}
            <span className="text-xs font-semibold text-emerald-600">
              Save ₹{(product.originalPrice - product.price).toLocaleString('en-IN')}
            </span>
          </div>

          {/* Marketplace Badges */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-400 mr-1">Available at:</span>
            {validMarketplaces.slice(0, 3).map((m) => (
              <MarketplaceBadge key={m.name} name={m.name} size="sm" />
            ))}
            {validMarketplaces.length > 3 && (
              <span className="text-[11px] text-slate-400 font-medium">
                +{validMarketplaces.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 pt-3 flex items-center gap-2">
          <Link
            href={`/product/${product.slug}`}
            className="flex-1 inline-flex items-center justify-center gap-1 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-semibold text-xs py-2 px-3 rounded-xl transition-colors shadow-2xs"
          >
            <span>View Deal</span>
            <ArrowUpRight size={14} />
          </Link>
          <Link
            href={`/compare?productA=${product.slug}`}
            title="Compare with other products"
            className="p-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors"
            aria-label="Compare"
          >
            <GitCompare size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
};
