import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import {
  Target,
  ShieldCheck,
  TrendingDown,
  ShoppingBag,
  ArrowRight,
} from 'lucide-react';

import { buildCanonicalUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'About Us | India’s Deal Discovery & Price Comparison Platform | OnlineSaleLive',
  description:
    'Learn how OnlineSaleLive empowers Indian shoppers with verified deals, price drop tracking, and honest multi-store comparisons.',
  alternates: {
    canonical: buildCanonicalUrl('/about'),
  },
  openGraph: {
    title: 'About Us | India’s Deal Discovery & Price Comparison Platform | OnlineSaleLive',
    description:
      'Learn how OnlineSaleLive empowers Indian shoppers with verified deals, price drop tracking, and honest multi-store comparisons.',
    url: buildCanonicalUrl('/about'),
    siteName: 'OnlineSaleLive',
    locale: 'en_IN',
    type: 'website',
  },
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12">
      <Breadcrumbs items={[{ label: 'About Us' }]} />

      {/* Header Banner */}
      <div className="bg-linear-to-r from-slate-900 via-slate-850 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
            <Target size={14} />
            <span>Our Mission</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-2">
            About OnlineSaleLive
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Helping Indian consumers make smarter purchasing decisions and save real money every time they shop online.
          </p>
        </div>
      </div>

      {/* What We Do */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-2xs space-y-6">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
          Empowering Indian Online Shoppers
        </h2>
        <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
          Online shopping in India has exploded, but finding genuine discounts among hundreds of daily sales, confusing bank offers, and dynamic algorithmic pricing has become overwhelming.
        </p>
        <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
          <strong>OnlineSaleLive (onlinesalelive.in)</strong> was built to solve this exact problem. We act as your independent shopping intelligence desk, aggregating top deals, verifying actual price drops against MRP markups, and comparing prices side-by-side across major retailers like <strong>Amazon, Flipkart, Myntra, AJIO, and Meesho</strong>.
        </p>
      </div>

      {/* Core Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
            <TrendingDown size={24} />
          </div>
          <h3 className="font-bold text-slate-900 text-lg">Verified Price Drops</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            We weed out fake MRP markdowns and highlight authentic price cuts during flash sales and festive clearance events.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ShoppingBag size={24} />
          </div>
          <h3 className="font-bold text-slate-900 text-lg">Cross-Store Comparison</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            No single store has the best price every day. We compare options so you never overpay for tech, footwear, or apparel.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck size={24} />
          </div>
          <h3 className="font-bold text-slate-900 text-lg">Unbiased Editorial Advice</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Our buying guides and reviews focus strictly on value-for-money, build durability, and real-world specs testing.
          </p>
        </div>
      </div>

      {/* Editorial Standards */}
      <div className="bg-slate-50 rounded-3xl p-6 sm:p-8 border border-slate-200/90 space-y-4">
        <h3 className="text-lg sm:text-xl font-bold text-slate-900">
          Our Editorial Integrity & Transparency
        </h3>
        <p className="text-sm text-slate-600 leading-relaxed">
          We maintain full editorial independence. Our reviews and curated recommendations are never dictated by retail advertisers. When you click on retailer links and make a purchase, we may earn an affiliate referral fee at no extra cost to you, which helps fund our ongoing research and testing.
        </p>
        <div className="pt-2">
          <Link
            href="/affiliate-disclosure"
            className="text-xs font-bold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1"
          >
            <span>Read Our Full Affiliate Disclosure</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
