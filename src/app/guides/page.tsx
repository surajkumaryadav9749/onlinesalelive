import React from 'react';
import { getAllGuides } from '@/lib/data-service';
import { GuideCard } from '@/components/guides/GuideCard';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { BookOpen } from 'lucide-react';
import type { Metadata } from 'next';

import { buildCanonicalUrl } from '@/lib/seo';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Expert Buying Guides | Best Products & Budget Recommendations in India',
  description:
    'Comprehensive buyer guides for earbuds, smartphones, shoes, laptops and clothing under various budget brackets in India.',
  alternates: {
    canonical: buildCanonicalUrl('/guides'),
  },
  openGraph: {
    title: 'Expert Buying Guides | Best Products & Budget Recommendations in India',
    description:
      'Comprehensive buyer guides for earbuds, smartphones, shoes, laptops and clothing under various budget brackets in India.',
    url: buildCanonicalUrl('/guides'),
    siteName: 'OnlineSaleLive',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Expert Buying Guides | Best Products & Budget Recommendations in India',
    description:
      'Comprehensive buyer guides for earbuds, smartphones, shoes, laptops and clothing under various budget brackets in India.',
  },
};

export default async function GuidesPage() {
  const guides = await getAllGuides();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      <Breadcrumbs items={[{ label: 'Buying Guides' }]} />

      {/* Header */}
      <div className="bg-linear-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-lg">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
            <BookOpen size={14} />
            <span>Curated Consumer Research</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-2">
            In-Depth Buying Guides
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Our editorial guides distill hundreds of hours of hands-on testing, specs scrutiny, and real customer reviews to help you make confident purchases.
          </p>
        </div>
      </div>

      {/* Guides Grid */}
      {guides.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {guides.map((guide) => (
            <GuideCard key={guide.id} guide={guide} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 max-w-xl mx-auto shadow-xs">
          <BookOpen size={32} className="mx-auto text-slate-400 mb-3" />
          <p className="text-base text-slate-700 font-semibold">No buying guides published yet.</p>
          <p className="text-xs text-slate-400 mt-1">Our editorial desk is preparing comprehensive shopping guides. Check back soon.</p>
        </div>
      )}
    </div>
  );
}
