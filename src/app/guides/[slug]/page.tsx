import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getAllGuides,
  getGuideBySlug,
  getProductBySlug,
  getRelatedGuides,
  getRelatedComparisons,
} from '@/lib/data-service';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { ProductCard } from '@/components/products/ProductCard';
import { GuideCard } from '@/components/guides/GuideCard';
import { ComparisonCard } from '@/components/compare/ComparisonCard';
import {
  Clock,
  Calendar,
  User,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  Award,
} from 'lucide-react';
import type { Metadata } from 'next';

export const revalidate = 60;
export const dynamicParams = true;

interface GuidePageProps {
  params: Promise<{ slug: string }>;
}

import {
  createGuideMetadata,
  generateArticleSchema,
  buildCanonicalUrl,
  serializeJsonLd,
} from '@/lib/seo';

export async function generateStaticParams() {
  const guides = await getAllGuides();
  return guides.map((g) => ({
    slug: g.slug,
  }));
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getGuideBySlug(slug);

  if (!guide) {
    return {
      title: 'Guide Not Found | OnlineSaleLive',
      robots: { index: false, follow: false },
    };
  }

  return createGuideMetadata(guide);
}

export default async function GuideDetailPage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide = await getGuideBySlug(slug);

  if (!guide) {
    notFound();
  }

  const articleSchema = generateArticleSchema({
    title: guide.title,
    description: guide.excerpt,
    url: buildCanonicalUrl(`/guides/${guide.slug}`),
    image: guide.image,
    authorName: guide.author,
  });

  // Fetch recommended products
  const relatedProductsPromises = guide.relatedProductSlugs.map((slug) =>
    getProductBySlug(slug)
  );
  const relatedProductsResults = await Promise.all(relatedProductsPromises);
  const validProducts = relatedProductsResults.filter(
    (p): p is NonNullable<typeof p> => p !== undefined
  );

  const [otherGuides, relatedComparisons] = await Promise.all([
    getRelatedGuides(guide.categorySlug, 3).then((list) => list.filter((g) => g.slug !== guide.slug)),
    getRelatedComparisons(guide.categorySlug, undefined, 2),
  ]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">
      {/* Article Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(articleSchema) }}
      />

      <Breadcrumbs
        items={[
          { label: 'Guides', href: '/guides' },
          { label: guide.title },
        ]}
      />

      {/* Header Info */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
            {guide.category}
          </span>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Clock size={12} />
            {guide.readTime}
          </span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
          {guide.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1 pb-4 border-b border-slate-200">
          <span className="flex items-center gap-1.5 font-medium text-slate-700">
            <User size={14} className="text-slate-400" />
            {guide.author}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Calendar size={14} className="text-slate-400" />
            Last Updated: {guide.updatedAt}
          </span>
        </div>
      </div>

      {/* Hero Image */}
      <div className="relative w-full h-64 sm:h-96 rounded-3xl overflow-hidden shadow-sm">
        <Image
          src={guide.image}
          alt={guide.title}
          fill
          priority
          className="object-cover"
        />
      </div>

      {/* Introduction */}
      <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed space-y-4">
        <p className="text-base sm:text-lg font-medium text-slate-900 border-l-4 border-orange-500 pl-4 py-1 italic bg-orange-50/40 rounded-r-xl">
          {guide.excerpt}
        </p>
        <div className="text-sm sm:text-base leading-relaxed whitespace-pre-line">
          {guide.content}
        </div>
      </div>

      {/* Top Picks / Recommendations */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center gap-2">
          <Award size={20} className="text-orange-600" />
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Editor&apos;s Top Recommendations
          </h2>
        </div>

        <div className="space-y-4">
          {guide.topPicks.map((pick, i) => (
            <div
              key={i}
              className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs hover:border-orange-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
                  {pick.subtitle}
                </span>
                <h3 className="font-bold text-slate-900 text-lg">{pick.title}</h3>
                <p className="text-xs text-slate-600 max-w-xl">{pick.whyBuy}</p>
              </div>

              <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 shrink-0">
                <span className="text-xl font-black text-slate-900">
                  ₹{pick.price.toLocaleString('en-IN')}
                </span>
                {pick.productSlug && (
                  <Link
                    href={`/product/${pick.productSlug}`}
                    className="inline-flex items-center gap-1 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow-2xs"
                  >
                    <span>View Deal</span>
                    <ArrowRight size={13} />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="space-y-4 pt-4">
        <h2 className="text-xl font-bold text-slate-900">
          Quick Comparison Table
        </h2>
        <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {guide.comparisonTable.headers.map((h, i) => (
                  <th key={i} className="p-3.5 font-bold text-slate-800">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {guide.comparisonTable.rows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50/60 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="p-3.5 text-slate-700 font-medium">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Buying Tips */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2 text-amber-900">
          <HelpCircle size={20} className="text-amber-600" />
          <h2 className="text-lg sm:text-xl font-bold">
            Smart Buying Tips & Money-Saving Advice
          </h2>
        </div>
        <ul className="space-y-2.5 text-xs sm:text-sm text-amber-950">
          {guide.buyingTips.map((tip, i) => (
            <li key={i} className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Pros & Cons of the Category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-5 space-y-2">
          <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>Key Advantages</span>
          </h3>
          <ul className="space-y-1.5 text-xs text-emerald-950">
            {guide.pros.map((p, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-emerald-500 font-bold">•</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-5 space-y-2">
          <h3 className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
            <XCircle size={16} className="text-rose-600" />
            <span>Things to Watch Out For</span>
          </h3>
          <ul className="space-y-1.5 text-xs text-rose-950">
            {guide.cons.map((c, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-rose-500 font-bold">•</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recommended Products Grid */}
      {validProducts.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">
            Featured Products from This Guide
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {validProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Related Comparisons */}
      {relatedComparisons.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">
              Related Product Comparisons
            </h2>
            <Link
              href="/compare"
              className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1"
            >
              <span>All Comparisons</span>
              <ArrowRight size={13} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {relatedComparisons.map((c) => (
              <ComparisonCard key={c.id} comparison={c} />
            ))}
          </div>
        </div>
      )}

      {/* Related Guides */}
      {otherGuides.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">
            More Related Guides
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {otherGuides.map((g) => (
              <GuideCard key={g.id} guide={g} />
            ))}
          </div>
        </div>
      )}

      {/* Affiliate Transparency Disclosure */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-500 leading-relaxed space-y-1">
        <p className="font-semibold text-slate-700">Affiliate Disclosure & Editorial Independence</p>
        <p>
          OnlineSaleLive is reader-supported. When you purchase through retailer links in this guide, we may earn an affiliate commission at no extra cost to you. Editorial recommendations and comparison tables are independently formulated without sponsor influence.
        </p>
      </div>
    </div>
  );
}
