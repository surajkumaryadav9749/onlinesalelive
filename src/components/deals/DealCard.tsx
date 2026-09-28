'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Deal } from '@/types';
import { DealBadge } from '@/components/ui/DealBadge';
import { MarketplaceBadge } from '@/components/ui/MarketplaceBadge';
import { Clock, ArrowRight } from 'lucide-react';

interface DealCardProps {
  deal: Deal;
}

export const DealCard: React.FC<DealCardProps> = ({ deal }) => {
  const [imgSrc, setImgSrc] = useState(deal.product.image);

  return (
    <div className="group bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col sm:flex-row">
      {/* Product Image Area */}
      <div className="relative w-full sm:w-48 h-48 sm:h-auto shrink-0 bg-slate-50 overflow-hidden">
        <Image
          src={imgSrc}
          alt={deal.product.name}
          fill
          sizes="(max-width: 640px) 100vw, 200px"
          className="object-cover object-center group-hover:scale-105 transition-transform duration-300 p-2"
          onError={() => {
            setImgSrc(
              `https://placehold.co/400x400/e2e8f0/0f172a?text=${encodeURIComponent(
                deal.product.name.slice(0, 15)
              )}`
            );
          }}
        />
        <div className="absolute top-2 left-2">
          <span className="bg-red-600 text-white font-extrabold text-xs px-2 py-0.5 rounded shadow-sm">
            {deal.discountPercent}% OFF
          </span>
        </div>
      </div>

      {/* Details Area */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Header Tag Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <DealBadge type={deal.dealType} size="sm" />
            <MarketplaceBadge name={deal.marketplace} size="sm" />
          </div>

          {/* Title */}
          <Link href={`/product/${deal.product.slug}`} className="block group-hover:text-blue-600">
            <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2">
              {deal.title}
            </h3>
          </Link>
          <p className="text-xs text-slate-500 mt-1 line-clamp-1">
            {deal.product.name}
          </p>

          {/* Price Row */}
          <div className="mt-3 flex items-baseline gap-2.5">
            <span className="text-xl font-black text-slate-900">
              ₹{deal.product.price.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-slate-400 line-through">
              ₹{deal.product.originalPrice.toLocaleString('en-IN')}
            </span>
            <span className="text-xs font-semibold text-emerald-600">
              Save ₹{(deal.product.originalPrice - deal.product.price).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Timer & CTA */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          {deal.endsIn ? (
            <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded-md">
              <Clock size={13} className="text-amber-600" />
              <span>Ends in {deal.endsIn}</span>
            </div>
          ) : (
            <span className="text-xs text-slate-400">Verified deal</span>
          )}

          <Link
            href={`/product/${deal.product.slug}`}
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-orange-600 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors shrink-0 shadow-2xs"
          >
            <span>View Deal</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
};
