import React from 'react';
import { getAllReviews } from '@/lib/data-service';
import { ReviewCard } from '@/components/reviews/ReviewCard';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Award } from 'lucide-react';
import type { Metadata } from 'next';

import { buildCanonicalUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Hands-on Product Reviews & Verdicts | OnlineSaleLive',
  description:
    'Unbiased, comprehensive product reviews with laboratory testing, pros, cons, and multi-store price comparisons across India.',
  alternates: {
    canonical: buildCanonicalUrl('/reviews'),
  },
  openGraph: {
    title: 'Hands-on Product Reviews & Verdicts | OnlineSaleLive',
    description:
      'Unbiased, comprehensive product reviews with laboratory testing, pros, cons, and multi-store price comparisons across India.',
    url: buildCanonicalUrl('/reviews'),
    siteName: 'OnlineSaleLive',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hands-on Product Reviews & Verdicts | OnlineSaleLive',
    description:
      'Unbiased, comprehensive product reviews with laboratory testing, pros, cons, and multi-store price comparisons across India.',
  },
};

export default async function ReviewsPage() {
  const reviews = await getAllReviews();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      <Breadcrumbs items={[{ label: 'Product Reviews' }]} />

      {/* Header */}
      <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-lg">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
            <Award size={14} />
            <span>Unbiased Evaluations</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-2">
            In-Depth Product Reviews
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Real testing, detailed pros and cons, benchmark comparisons, and live pricing from Amazon, Flipkart, Myntra, and AJIO.
          </p>
        </div>
      </div>

      {/* Reviews Grid */}
      {reviews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 max-w-xl mx-auto shadow-xs">
          <Award size={32} className="mx-auto text-slate-400 mb-3" />
          <p className="text-base text-slate-700 font-semibold">No product reviews published yet.</p>
          <p className="text-xs text-slate-400 mt-1">Our review desk is testing gadgets and apparel. Detailed verdicts will be published soon.</p>
        </div>
      )}
    </div>
  );
}
