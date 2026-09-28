import React from 'react';
import type { Metadata } from 'next';
import { getAllBlogPosts } from '@/lib/data-service';
import { BlogCard } from '@/components/blog/BlogCard';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Newspaper } from 'lucide-react';

import { buildCanonicalUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Shopping Hacks, Festive Guides & E-commerce Tips | OnlineSaleLive Blog',
  description:
    'Expert tips on stacking credit card offers, open-box delivery inspections, and comparing Amazon, Flipkart, Myntra, and AJIO.',
  alternates: {
    canonical: buildCanonicalUrl('/blog'),
  },
  openGraph: {
    title: 'Shopping Hacks, Festive Guides & E-commerce Tips | OnlineSaleLive Blog',
    description:
      'Expert tips on stacking credit card offers, open-box delivery inspections, and comparing Amazon, Flipkart, Myntra, and AJIO.',
    url: buildCanonicalUrl('/blog'),
    siteName: 'OnlineSaleLive',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shopping Hacks, Festive Guides & E-commerce Tips | OnlineSaleLive Blog',
    description:
      'Expert tips on stacking credit card offers, open-box delivery inspections, and comparing Amazon, Flipkart, Myntra, and AJIO.',
  },
};

export default async function BlogPage() {
  const posts = await getAllBlogPosts();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      <Breadcrumbs items={[{ label: 'Blog' }]} />

      {/* Header Banner */}
      <div className="bg-linear-to-r from-slate-900 via-slate-850 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
            <Newspaper size={14} />
            <span>Smart Shopping Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-2">
            The OnlineSaleLive Blog
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Insider secrets, bank offer stacking techniques, consumer rights guides, and store comparison breakdowns to maximize your shopping savings.
          </p>
        </div>

        {/* Decorative background blob */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Featured Articles Grid */}
      {posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 max-w-xl mx-auto shadow-xs">
          <Newspaper size={32} className="mx-auto text-slate-400 mb-3" />
          <p className="text-base text-slate-700 font-semibold">No blog articles published yet.</p>
          <p className="text-xs text-slate-400 mt-1">Smart shopping strategies, festive calendars, and savings tips will appear here soon.</p>
        </div>
      )}
    </div>
  );
}
