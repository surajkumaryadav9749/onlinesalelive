import React from 'react';
import { notFound } from 'next/navigation';
import { getAllProducts, getAllComparisons } from '@/lib/data-service';
import { CompareTable } from '@/components/compare/CompareTable';
import { ComparisonCard } from '@/components/compare/ComparisonCard';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { GitCompare, Layers } from 'lucide-react';
import type { Metadata } from 'next';

import { buildCanonicalUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Compare Products Side-by-Side | Specifications, Ratings & Best Deals',
  description:
    'Compare features, benchmark ratings, battery longevity, and marketplace prices side-by-side to make the smartest purchase decision.',
  alternates: {
    canonical: buildCanonicalUrl('/compare'),
  },
  openGraph: {
    title: 'Compare Products Side-by-Side | Specifications, Ratings & Best Deals',
    description:
      'Compare features, benchmark ratings, battery longevity, and marketplace prices side-by-side to make the smartest purchase decision.',
    url: buildCanonicalUrl('/compare'),
    siteName: 'OnlineSaleLive',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Compare Products Side-by-Side | Specifications, Ratings & Best Deals',
    description:
      'Compare features, benchmark ratings, battery longevity, and marketplace prices side-by-side to make the smartest purchase decision.',
  },
};

interface ComparePageProps {
  searchParams: Promise<{ productA?: string; productB?: string }>;
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const { productA: productASlug, productB: productBSlug } = await searchParams;
  const [products, comparisons] = await Promise.all([
    getAllProducts(),
    getAllComparisons(),
  ]);

  // If specific product slugs were provided in URL but don't exist, return 404 to avoid soft 404
  if (productASlug && !products.some((p) => p.slug === productASlug.toLowerCase())) {
    notFound();
  }
  if (productBSlug && !products.some((p) => p.slug === productBSlug.toLowerCase())) {
    notFound();
  }

  // Find products or default to two popular items
  const defaultProductA = products.find((p) => p.slug === (productASlug || 'boat-airdopes-141-anc-earbuds')) || products[0];
  const defaultProductB = products.find((p) => p.slug === (productBSlug || 'boat-bassheads-100-wired-earphones')) || products[1];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12">
      <Breadcrumbs items={[{ label: 'Compare Products' }]} />

      {/* Header */}
      <div className="bg-linear-to-r from-slate-900 to-slate-800 text-white rounded-3xl p-6 sm:p-10 shadow-lg">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
            <GitCompare size={14} />
            <span>Side-by-Side Comparison Tool</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-2">
            Compare Products & Find the Superior Value
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Examine head-to-head specifications, key strengths, potential watch-outs, and live prices across Indian online stores.
          </p>
        </div>
      </div>

      {/* Interactive Compare Matrix Component */}
      {products.length >= 2 && defaultProductA && defaultProductB ? (
        <CompareTable
          initialProductA={defaultProductA}
          initialProductB={defaultProductB}
          allProducts={products}
        />
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 max-w-xl mx-auto shadow-xs">
          <GitCompare size={32} className="mx-auto text-slate-400 mb-3" />
          <p className="text-base text-slate-700 font-semibold">Side-by-side comparison updating</p>
          <p className="text-xs text-slate-400 mt-1">Catalog items are syncing. Check back shortly to compare products side-by-side.</p>
        </div>
      )}

      {/* Curated Expert Comparisons */}
      {comparisons.length > 0 && (
        <section className="space-y-6 pt-6 border-t border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">
              <Layers size={14} />
              <span>Editorial Benchmarks</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              Curated Head-to-Head Comparisons
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Thorough side-by-side spec sheets and buyer evaluations written by our editorial testing desk.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {comparisons.map((comp) => (
              <ComparisonCard key={comp.id} comparison={comp} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
