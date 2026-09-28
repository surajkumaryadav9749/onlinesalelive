'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Review } from '@/types';
import { RatingStars } from '@/components/ui/RatingStars';
import { Check, X, ArrowRight } from 'lucide-react';

interface ReviewCardProps {
  review: Review;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  const [imgSrc, setImgSrc] = useState(review.image);

  return (
    <div className="group bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col">
      <div className="relative w-full h-44 bg-slate-50 overflow-hidden">
        <Image
          src={imgSrc}
          alt={review.productName}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          onError={() => {
            setImgSrc(
              `https://placehold.co/600x400/e2e8f0/0f172a?text=${encodeURIComponent(
                review.productName.slice(0, 15)
              )}`
            );
          }}
        />
        <div className="absolute top-3 right-3 bg-slate-900/90 text-white text-xs font-bold px-2 py-1 rounded-md shadow-xs flex items-center gap-1">
          <span>{review.rating} / 5.0</span>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <RatingStars rating={review.rating} size="sm" />
            <span className="text-xs text-slate-400">{review.date}</span>
          </div>

          <Link href={`/reviews/${review.slug}`} className="block group-hover:text-blue-600">
            <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2">
              {review.title}
            </h3>
          </Link>
          <p className="text-xs text-slate-600 mt-2 line-clamp-2 italic">
            &ldquo;{review.verdict}&rdquo;
          </p>

          {/* Quick Pros/Cons Preview */}
          <div className="mt-3 space-y-1.5 text-xs">
            {review.pros.slice(0, 1).map((pro, i) => (
              <div key={i} className="flex items-center gap-1.5 text-emerald-700">
                <Check size={14} className="shrink-0 text-emerald-500" />
                <span className="truncate">{pro}</span>
              </div>
            ))}
            {review.cons.slice(0, 1).map((con, i) => (
              <div key={i} className="flex items-center gap-1.5 text-rose-600">
                <X size={14} className="shrink-0 text-rose-400" />
                <span className="truncate">{con}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs">
            <span className="text-slate-400">Deal: </span>
            <span className="font-bold text-slate-900">
              ₹{review.price.toLocaleString('en-IN')}
            </span>
          </div>
          <Link
            href={`/reviews/${review.slug}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:text-blue-700"
          >
            <span>Full Review</span>
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
};
