'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ComparisonItem } from '@/types';
import { GitCompare, ArrowRight, Layers } from 'lucide-react';

interface ComparisonCardProps {
  comparison: ComparisonItem;
}

export const ComparisonCard: React.FC<ComparisonCardProps> = ({ comparison }) => {
  const [imgSrc, setImgSrc] = useState(
    comparison.image || 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80'
  );

  return (
    <div className="group bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col">
      <div className="relative w-full h-44 bg-slate-100 overflow-hidden">
        <Image
          src={imgSrc}
          alt={comparison.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          onError={() => {
            setImgSrc(
              `https://placehold.co/600x400/e2e8f0/0f172a?text=${encodeURIComponent(
                comparison.title.slice(0, 15)
              )}`
            );
          }}
        />
        <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 bg-slate-900/90 text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-xs backdrop-blur-xs">
          <GitCompare size={12} className="text-orange-400" />
          <span>Head-to-Head</span>
        </div>

        {comparison.productSlugs && comparison.productSlugs.length > 0 && (
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs text-slate-800 text-[11px] font-semibold px-2 py-0.5 rounded-md shadow-xs">
            {comparison.productSlugs.length} Items Compared
          </div>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <Link href={`/compare/${comparison.slug}`} className="block group-hover:text-orange-600">
            <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2">
              {comparison.title}
            </h3>
          </Link>
          <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
            {comparison.description}
          </p>

          {comparison.products && comparison.products.length > 0 && (
            <div className="mt-3.5 pt-3 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Included Products:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {comparison.products.slice(0, 2).map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center text-[11px] bg-slate-50 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-medium truncate max-w-[180px]"
                  >
                    {p.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium inline-flex items-center gap-1">
            <Layers size={13} />
            <span>Side-by-Side</span>
          </span>
          <Link
            href={`/compare/${comparison.slug}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 group-hover:text-orange-700"
          >
            <span>View Comparison</span>
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
};
