import React from 'react';
import { getAllProducts } from '@/lib/data-service';
import { ProductCard } from '@/components/products/ProductCard';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Percent } from 'lucide-react';
import type { Metadata } from 'next';
import { buildCanonicalUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Discount Brackets & Clearance Deals — Up to 70%+ Off | OnlineSaleLive',
  description:
    'Explore verified discounts categorized by tier (10%, 20%, 30%, 50%, and 70%+ off) across Amazon, Flipkart, Myntra, and AJIO.',
  alternates: {
    canonical: buildCanonicalUrl('/discounts'),
  },
  openGraph: {
    title: 'Discount Brackets & Clearance Deals — Up to 70%+ Off | OnlineSaleLive',
    description:
      'Explore verified discounts categorized by tier (10%, 20%, 30%, 50%, and 70%+ off) across Amazon, Flipkart, Myntra, and AJIO.',
    url: buildCanonicalUrl('/discounts'),
    siteName: 'OnlineSaleLive',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Discount Brackets & Clearance Deals — Up to 70%+ Off | OnlineSaleLive',
    description:
      'Explore verified discounts categorized by tier (10%, 20%, 30%, 50%, and 70%+ off) across Amazon, Flipkart, Myntra, and AJIO.',
  },
};

export default async function DiscountsPage() {
  const products = await getAllProducts();

  const discountTiers = [
    {
      tier: '70%+ OFF',
      min: 70,
      badge: 'Unbeatable Steals',
      description: 'Massive clearance discounts up to 75% off regular prices.',
      products: products.filter((p) => p.discountPercent >= 70),
    },
    {
      tier: '50%+ OFF',
      min: 50,
      badge: 'Half Price or Less',
      description: 'Save at least half your money on top electronics, fashion & shoes.',
      products: products.filter((p) => p.discountPercent >= 50 && p.discountPercent < 70),
    },
    {
      tier: '30%+ OFF',
      min: 30,
      badge: 'High Value Offers',
      description: 'Substantial markdowns across kitchenware, smartwatches & accessories.',
      products: products.filter((p) => p.discountPercent >= 30 && p.discountPercent < 50),
    },
    {
      tier: '20%+ OFF',
      min: 20,
      badge: 'Brand Discounts',
      description: 'Reliable savings on popular mobile phones, audio gear and power banks.',
      products: products.filter((p) => p.discountPercent >= 20 && p.discountPercent < 30),
    },
    {
      tier: '10%+ OFF',
      min: 10,
      badge: 'Bank & Flagship Offers',
      description: 'Competitive bank discounts and exchange offers on flagship tech.',
      products: products.filter((p) => p.discountPercent >= 10 && p.discountPercent < 20),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12">
      <Breadcrumbs items={[{ label: 'Discounts' }]} />

      {/* Banner */}
      <div className="bg-linear-to-r from-red-600 to-amber-600 text-white rounded-3xl p-6 sm:p-10 shadow-lg">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
            <Percent size={14} />
            <span>Discount Brackets Engine</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-2">
            Discounts by Percentage
          </h1>
          <p className="text-red-100 text-sm sm:text-base leading-relaxed">
            Quickly jump to deep clearance bargains ranging from 10% to over 70% flat markdown.
          </p>
        </div>
      </div>

      {/* Quick Nav Anchors */}
      {products.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {discountTiers.map((tier) => (
            <a
              key={tier.tier}
              href={`#tier-${tier.min}`}
              className="px-4 py-2 bg-white hover:bg-orange-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-700 hover:text-orange-600 transition-colors whitespace-nowrap shadow-2xs"
            >
              {tier.tier} ({tier.products.length})
            </a>
          ))}
        </div>
      )}

      {/* Discount Tiers Sections */}
      {products.length > 0 ? (
        <div className="space-y-16">
          {discountTiers
            .filter((tier) => tier.products.length > 0)
            .map((tier) => (
              <section key={tier.tier} id={`tier-${tier.min}`} className="space-y-4 pt-4 scroll-mt-24">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-3 border-b border-slate-200 gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded">
                        {tier.badge}
                      </span>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                        {tier.tier} Products
                      </h2>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500">{tier.description}</p>
                  </div>
                  <span className="text-xs font-semibold text-slate-400">
                    {tier.products.length} products listed
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  {tier.products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 max-w-xl mx-auto shadow-xs">
          <Percent size={32} className="mx-auto text-slate-400 mb-3" />
          <p className="text-base text-slate-700 font-semibold">No discounted products listed right now.</p>
          <p className="text-xs text-slate-400 mt-1">Discounts and price slashes are updated as offers go live across partner stores.</p>
        </div>
      )}
    </div>
  );
}
