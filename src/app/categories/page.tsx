import React from 'react';
import { getAllCategories } from '@/lib/data-service';
import { CategoryCard } from '@/components/categories/CategoryCard';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Layers } from 'lucide-react';
import type { Metadata } from 'next';
import { buildCanonicalUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'All Product Categories — Deals & Shopping Guides | OnlineSaleLive',
  description:
    'Browse all shopping categories across Amazon, Flipkart, Myntra, AJIO, and Meesho. Compare prices, discounts, and ratings.',
  alternates: {
    canonical: buildCanonicalUrl('/categories'),
  },
  openGraph: {
    title: 'All Product Categories — Deals & Shopping Guides | OnlineSaleLive',
    description:
      'Browse all shopping categories across Amazon, Flipkart, Myntra, AJIO, and Meesho. Compare prices, discounts, and ratings.',
    url: buildCanonicalUrl('/categories'),
    siteName: 'OnlineSaleLive',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'All Product Categories — Deals & Shopping Guides | OnlineSaleLive',
    description:
      'Browse all shopping categories across Amazon, Flipkart, Myntra, AJIO, and Meesho. Compare prices, discounts, and ratings.',
  },
};

export const revalidate = 60;

export default async function CategoriesPage() {
  const categories = await getAllCategories();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      <Breadcrumbs items={[{ label: 'Categories' }]} />

      {/* Header */}
      <div className="bg-linear-to-r from-slate-900 to-slate-800 text-white rounded-3xl p-6 sm:p-10 shadow-lg">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
            <Layers size={14} />
            <span>Product Taxonomy</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-2">
            Explore All Categories
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Browse through Indian shopping categories to discover tailored deals, lowest prices, and curated buyer guides.
          </p>
        </div>
      </div>

      {/* Categories Grid */}
      {categories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 max-w-xl mx-auto shadow-xs">
          <Layers size={32} className="mx-auto text-slate-400 mb-3" />
          <p className="text-base text-slate-700 font-semibold">No categories available yet.</p>
          <p className="text-xs text-slate-400 mt-1">Categories are being configured. Check back soon.</p>
        </div>
      )}
    </div>
  );
}
