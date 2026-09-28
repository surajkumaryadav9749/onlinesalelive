'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types';
import { RatingStars } from '@/components/ui/RatingStars';
import { Check, X, ArrowUpRight, GitCompare } from 'lucide-react';

interface CompareTableProps {
  initialProductA: Product;
  initialProductB: Product;
  allProducts: Product[];
}

export const CompareTable: React.FC<CompareTableProps> = ({
  initialProductA,
  initialProductB,
  allProducts,
}) => {
  const [productAId, setProductAId] = useState(initialProductA.id);
  const [productBId, setProductBId] = useState(initialProductB.id);

  const productA = allProducts.find((p) => p.id === productAId) || initialProductA;
  const productB = allProducts.find((p) => p.id === productBId) || initialProductB;

  // Extract all unique spec keys between product A and B
  const specKeys = Array.from(
    new Set([...Object.keys(productA.specifications), ...Object.keys(productB.specifications)])
  );

  return (
    <div className="space-y-8">
      {/* Product Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <label htmlFor="product-a-select" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Select Product 1
          </label>
          <select
            id="product-a-select"
            value={productAId}
            onChange={(e) => setProductAId(e.target.value)}
            aria-label="Select first product to compare"
            className="w-full text-sm font-semibold p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            {allProducts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (₹{p.price.toLocaleString('en-IN')})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="product-b-select" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Select Product 2
          </label>
          <select
            id="product-b-select"
            value={productBId}
            onChange={(e) => setProductBId(e.target.value)}
            aria-label="Select second product to compare"
            className="w-full text-sm font-semibold p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            {allProducts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (₹{p.price.toLocaleString('en-IN')})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparison Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header Row with Images & Basic Info */}
        <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50/70">
          <div className="p-4 sm:p-6 font-bold text-slate-700 text-sm flex items-center">
            <span className="flex items-center gap-1.5">
              <GitCompare size={18} className="text-orange-600" />
              <span>Specification</span>
            </span>
          </div>

          {/* Product A Header */}
          <div className="p-4 sm:p-6 text-center border-l border-slate-200 bg-white">
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-3">
              <Image
                src={productA.image}
                alt={productA.name}
                fill
                className="object-contain"
              />
            </div>
            <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
              {productA.category}
            </span>
            <h4 className="font-bold text-slate-900 text-sm sm:text-base mt-1 line-clamp-2">
              {productA.name}
            </h4>
            <div className="mt-2 text-lg font-black text-slate-900">
              ₹{productA.price.toLocaleString('en-IN')}
            </div>
            <div className="mt-1 flex justify-center">
              <RatingStars rating={productA.rating} reviewCount={productA.reviewCount} size="sm" />
            </div>
            <Link
              href={`/product/${productA.slug}`}
              className="mt-3 inline-flex items-center gap-1 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              <span>View Deal</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>

          {/* Product B Header */}
          <div className="p-4 sm:p-6 text-center border-l border-slate-200 bg-white">
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-3">
              <Image
                src={productB.image}
                alt={productB.name}
                fill
                className="object-contain"
              />
            </div>
            <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
              {productB.category}
            </span>
            <h4 className="font-bold text-slate-900 text-sm sm:text-base mt-1 line-clamp-2">
              {productB.name}
            </h4>
            <div className="mt-2 text-lg font-black text-slate-900">
              ₹{productB.price.toLocaleString('en-IN')}
            </div>
            <div className="mt-1 flex justify-center">
              <RatingStars rating={productB.rating} reviewCount={productB.reviewCount} size="sm" />
            </div>
            <Link
              href={`/product/${productB.slug}`}
              className="mt-3 inline-flex items-center gap-1 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              <span>View Deal</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>

        {/* Price Difference Row */}
        <div className="grid grid-cols-3 border-b border-slate-100 py-3 px-4 sm:px-6 items-center text-xs sm:text-sm">
          <div className="font-semibold text-slate-700">Price & Discount</div>
          <div className="border-l border-slate-100 px-3 text-slate-800">
            <span className="font-bold text-slate-900">₹{productA.price.toLocaleString('en-IN')}</span>{' '}
            <span className="text-emerald-600 font-semibold">({productA.discountPercent}% OFF)</span>
          </div>
          <div className="border-l border-slate-100 px-3 text-slate-800">
            <span className="font-bold text-slate-900">₹{productB.price.toLocaleString('en-IN')}</span>{' '}
            <span className="text-emerald-600 font-semibold">({productB.discountPercent}% OFF)</span>
          </div>
        </div>

        {/* Dynamic Specifications Rows */}
        {specKeys.map((key) => (
          <div
            key={key}
            className="grid grid-cols-3 border-b border-slate-100 py-3 px-4 sm:px-6 items-center text-xs sm:text-sm hover:bg-slate-50/50"
          >
            <div className="font-medium text-slate-600">{key}</div>
            <div className="border-l border-slate-100 px-3 text-slate-900 font-medium">
              {productA.specifications[key] || '—'}
            </div>
            <div className="border-l border-slate-100 px-3 text-slate-900 font-medium">
              {productB.specifications[key] || '—'}
            </div>
          </div>
        ))}

        {/* Pros Comparison */}
        <div className="grid grid-cols-3 border-b border-slate-100 py-4 px-4 sm:px-6 items-start text-xs sm:text-sm bg-slate-50/40">
          <div className="font-semibold text-slate-700">Key Strengths</div>
          <div className="border-l border-slate-100 px-3 space-y-1.5">
            {productA.pros.map((pro, i) => (
              <div key={i} className="flex items-start gap-1.5 text-emerald-800">
                <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>{pro}</span>
              </div>
            ))}
          </div>
          <div className="border-l border-slate-100 px-3 space-y-1.5">
            {productB.pros.map((pro, i) => (
              <div key={i} className="flex items-start gap-1.5 text-emerald-800">
                <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>{pro}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cons Comparison */}
        <div className="grid grid-cols-3 py-4 px-4 sm:px-6 items-start text-xs sm:text-sm">
          <div className="font-semibold text-slate-700">Watch-Outs</div>
          <div className="border-l border-slate-100 px-3 space-y-1.5">
            {productA.cons.map((con, i) => (
              <div key={i} className="flex items-start gap-1.5 text-rose-800">
                <X size={14} className="text-rose-500 shrink-0 mt-0.5" />
                <span>{con}</span>
              </div>
            ))}
          </div>
          <div className="border-l border-slate-100 px-3 space-y-1.5">
            {productB.cons.map((con, i) => (
              <div key={i} className="flex items-start gap-1.5 text-rose-800">
                <X size={14} className="text-rose-500 shrink-0 mt-0.5" />
                <span>{con}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
