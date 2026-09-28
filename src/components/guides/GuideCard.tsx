'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Guide } from '@/types';
import { Clock, ArrowRight } from 'lucide-react';

interface GuideCardProps {
  guide: Guide;
}

export const GuideCard: React.FC<GuideCardProps> = ({ guide }) => {
  const [imgSrc, setImgSrc] = useState(guide.image);

  return (
    <div className="group bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col">
      <div className="relative w-full h-44 bg-slate-100 overflow-hidden">
        <Image
          src={imgSrc}
          alt={guide.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          onError={() => {
            setImgSrc(
              `https://placehold.co/600x400/e2e8f0/0f172a?text=${encodeURIComponent(
                guide.title.slice(0, 15)
              )}`
            );
          }}
        />
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-slate-800 text-xs font-bold px-2.5 py-1 rounded-md shadow-xs">
          {guide.category}
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {guide.readTime}
            </span>
            <span>•</span>
            <span>Updated {guide.updatedAt}</span>
          </div>

          <Link href={`/guides/${guide.slug}`} className="block group-hover:text-blue-600">
            <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2">
              {guide.title}
            </h3>
          </Link>
          <p className="text-xs text-slate-500 mt-2 line-clamp-2">
            {guide.excerpt}
          </p>

          {guide.topPicks.length > 0 && (
            <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Top Recommendation:
              </span>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                <span className="truncate mr-2">{guide.topPicks[0].title}</span>
                <span className="text-orange-600 shrink-0">
                  ₹{guide.topPicks[0].price.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">By {guide.author}</span>
          <Link
            href={`/guides/${guide.slug}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:text-blue-700"
          >
            <span>Read Guide</span>
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
};
