import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getAllReviews,
  getReviewBySlug,
  getRelatedGuides,
  getRelatedComparisons,
} from '@/lib/data-service';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { RatingStars } from '@/components/ui/RatingStars';
import { MarketplaceComparison } from '@/components/products/MarketplaceComparison';
import { GuideCard } from '@/components/guides/GuideCard';
import { ComparisonCard } from '@/components/compare/ComparisonCard';
import {
  Award,
  CheckCircle2,
  XCircle,
  Calendar,
  User,
  ArrowRight,
} from 'lucide-react';
import type { Metadata } from 'next';

export const revalidate = 60;
export const dynamicParams = true;

interface ReviewPageProps {
  params: Promise<{ slug: string }>;
}

import {
  createReviewMetadata,
  generateArticleSchema,
  buildCanonicalUrl,
  serializeJsonLd,
} from '@/lib/seo';

export async function generateStaticParams() {
  const reviews = await getAllReviews();
  return reviews.map((r) => ({
    slug: r.slug,
  }));
}

export async function generateMetadata({ params }: ReviewPageProps): Promise<Metadata> {
  const { slug } = await params;
  const review = await getReviewBySlug(slug);

  if (!review) {
    return {
      title: 'Review Not Found | OnlineSaleLive',
      robots: { index: false, follow: false },
    };
  }

  return createReviewMetadata(review);
}

export default async function ReviewDetailPage({ params }: ReviewPageProps) {
  const { slug } = await params;
  const review = await getReviewBySlug(slug);

  if (!review) {
    notFound();
  }

  const [relatedGuides, relatedComparisons] = await Promise.all([
    getRelatedGuides('', 2, review.productSlug),
    getRelatedComparisons(undefined, review.productSlug, 2),
  ]);

  const reviewSchema = generateArticleSchema({
    title: `${review.title} — Editorial Review & Lab Test`,
    description: review.verdict,
    url: buildCanonicalUrl(`/reviews/${review.slug}`),
    image: review.image,
    authorName: review.author,
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">
      {/* Review Article Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(reviewSchema) }}
      />

      <Breadcrumbs
        items={[
          { label: 'Reviews', href: '/reviews' },
          { label: review.productName },
        ]}
      />

      {/* Header Info */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-orange-700 bg-orange-100/80 border border-orange-200 px-3 py-1 rounded-full">
            Editorial Evaluation
          </span>
          <span className="text-[11px] text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full font-medium">
            Staff Lab Assessment • Not Customer Submissions
          </span>
          <RatingStars rating={review.rating} size="sm" />
        </div>

        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
          {review.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1 pb-4 border-b border-slate-200">
          <span className="flex items-center gap-1.5 font-medium text-slate-700">
            <User size={14} className="text-slate-400" />
            {review.author}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Calendar size={14} className="text-slate-400" />
            Tested: {review.date}
          </span>
        </div>
      </div>

      {/* Hero Image */}
      <div className="relative w-full h-64 sm:h-96 rounded-3xl overflow-hidden shadow-sm">
        <Image
          src={review.image}
          alt={review.productName}
          fill
          priority
          className="object-cover"
        />
      </div>

      {/* Editorial Verdict Box */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
            The Final Verdict
          </span>
          <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-xs font-bold text-white">
            <Award size={14} className="text-amber-400" />
            <span>Score: {review.rating} / 5.0</span>
          </div>
        </div>
        <p className="text-base sm:text-lg font-medium leading-relaxed text-slate-200 italic">
          &ldquo;{review.verdict}&rdquo;
        </p>
        <div className="pt-2 flex items-center gap-3">
          <Link
            href={`/product/${review.productSlug}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-orange-400 hover:text-orange-300"
          >
            <span>View Full Product Specs & Image Gallery</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* Pros & Cons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>Strengths & Highlights</span>
          </h3>
          <ul className="space-y-2 text-xs sm:text-sm text-emerald-950">
            {review.pros.map((p, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
            <XCircle size={16} className="text-rose-600" />
            <span>Drawbacks & Compromises</span>
          </h3>
          <ul className="space-y-2 text-xs sm:text-sm text-rose-950">
            {review.cons.map((c, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">•</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Specifications */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-2xs">
        <h2 className="text-lg font-bold text-slate-900">
          Tested Specifications
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
          {Object.entries(review.specifications).map(([key, val]) => (
            <div
              key={key}
              className="flex items-center justify-between py-2 border-b border-slate-100 text-xs sm:text-sm"
            >
              <span className="text-slate-500 font-medium">{key}</span>
              <span className="text-slate-900 font-semibold">{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Live Marketplace Comparison */}
      <div className="space-y-4 pt-4">
        <h2 className="text-lg font-bold text-slate-900">
          Compare Prices Across Stores
        </h2>
        <MarketplaceComparison
          marketplaces={review.marketplaces}
          productName={review.productName}
          productSlug={review.productSlug}
        />
      </div>

      {/* Related Comparisons */}
      {relatedComparisons.length > 0 && (
        <section className="space-y-4 pt-6 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Related Product Comparisons
            </h2>
            <Link
              href="/compare"
              className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1"
            >
              <span>More Comparisons</span>
              <ArrowRight size={13} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {relatedComparisons.map((c) => (
              <ComparisonCard key={c.id} comparison={c} />
            ))}
          </div>
        </section>
      )}

      {/* Related Buying Guides */}
      {relatedGuides.length > 0 && (
        <section className="space-y-4 pt-6 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Related Buying Guides
            </h2>
            <Link
              href="/guides"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>All Guides</span>
              <ArrowRight size={13} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {relatedGuides.map((g) => (
              <GuideCard key={g.id} guide={g} />
            ))}
          </div>
        </section>
      )}

      {/* Editorial & Affiliate Transparency Note */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-500 leading-relaxed space-y-1">
        <p className="font-semibold text-slate-700">Editorial Independence & Affiliate Policy</p>
        <p>
          This review is an independent editorial assessment conducted by our in-house testing staff. Ratings and verdict summaries represent our editorial analysis, not aggregated user reviews. When you buy through our links, we may receive an affiliate commission at no extra cost to you.
        </p>
      </div>
    </div>
  );
}
