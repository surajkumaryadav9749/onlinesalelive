import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getAllComparisons,
  getComparisonBySlug,
  getProductBySlug,
  getRelatedGuides,
  getRelatedProducts,
} from '@/lib/data-service';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { ProductCard } from '@/components/products/ProductCard';
import { GuideCard } from '@/components/guides/GuideCard';
import {
  GitCompare,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Layers,
  ArrowRight,
  Award,
} from 'lucide-react';
import type { Metadata } from 'next';
import {
  createComparisonMetadata,
  generateArticleSchema,
  buildCanonicalUrl,
  serializeJsonLd,
} from '@/lib/seo';
import { Product } from '@/types';

interface ComparisonPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const comparisons = await getAllComparisons();
  return comparisons.map((c) => ({
    slug: c.slug,
  }));
}

export async function generateMetadata({ params }: ComparisonPageProps): Promise<Metadata> {
  const { slug } = await params;
  const comparison = await getComparisonBySlug(slug);

  if (!comparison) {
    return {
      title: 'Comparison Not Found | OnlineSaleLive',
      robots: { index: false, follow: false },
    };
  }

  return createComparisonMetadata(comparison);
}

export default async function ComparisonDetailPage({ params }: ComparisonPageProps) {
  const { slug } = await params;
  const comparison = await getComparisonBySlug(slug);

  if (!comparison) {
    notFound();
  }

  // Populate products if needed
  let products = comparison.products || [];
  if (products.length === 0 && comparison.productSlugs.length > 0) {
    const fetched = await Promise.all(
      comparison.productSlugs.map((s) => getProductBySlug(s))
    );
    products = fetched.filter((p): p is Product => p !== undefined);
  }

  const articleSchema = generateArticleSchema({
    title: comparison.title,
    description: comparison.description,
    url: buildCanonicalUrl(`/compare/${comparison.slug}`),
    image: comparison.image,
    authorName: 'OnlineSaleLive Editorial Staff',
  });

  // Collect specs keys across all compared products
  const allSpecKeys = Array.from(
    new Set(products.flatMap((p) => Object.keys(p.specifications || {})))
  );

  // Related Guides and Products
  const primaryCategory = products[0]?.categorySlug || 'electronics';
  const [relatedGuides, relatedProducts] = await Promise.all([
    getRelatedGuides(primaryCategory, 2),
    getRelatedProducts(primaryCategory, products[0]?.slug || '', 4),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">
      {/* Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(articleSchema) }}
      />

      <Breadcrumbs
        items={[
          { label: 'Compare Products', href: '/compare' },
          { label: comparison.title },
        ]}
      />

      {/* Header Banner */}
      <div className="bg-linear-to-r from-slate-900 via-slate-850 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-lg">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
            <GitCompare size={14} />
            <span>Curated Head-to-Head Comparison</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-3">
            {comparison.title}
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            {comparison.description}
          </p>
        </div>
      </div>

      {/* Side-by-Side Product Cards */}
      {products.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Layers size={20} className="text-orange-600" />
            <span>Compared Contenders</span>
          </h2>

          <div
            className={`grid grid-cols-1 ${
              products.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'
            } gap-6`}
          >
            {products.map((p, idx) => {
              const bestOffer = p.marketplaces?.find((m) => m.inStock && m.isActive !== false) || p.marketplaces?.[0];
              const redirectSlug = p.slug;
              const marketplaceSlug = (bestOffer?.name || 'Amazon').toLowerCase();

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border-2 border-slate-200 p-5 shadow-xs flex flex-col justify-between relative hover:border-orange-300 transition-colors"
                >
                  <div className="absolute top-4 right-4 bg-slate-900 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                    Contender {idx + 1}
                  </div>

                  <div>
                    <div className="relative w-full h-48 bg-slate-50 rounded-xl overflow-hidden mb-4">
                      <Image
                        src={p.image}
                        alt={p.name}
                        fill
                        className="object-contain p-4"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                      {p.discountPercent > 0 && (
                        <span className="absolute bottom-2 left-2 bg-red-600 text-white font-bold text-xs px-2 py-0.5 rounded-md">
                          {p.discountPercent}% OFF
                        </span>
                      )}
                    </div>

                    <Link href={`/product/${p.slug}`} className="hover:text-orange-600 transition-colors">
                      <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2 mb-2">
                        {p.name}
                      </h3>
                    </Link>

                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-2xl font-black text-slate-900">
                        ₹{p.price.toLocaleString('en-IN')}
                      </span>
                      {p.originalPrice > p.price && (
                        <span className="text-xs text-slate-400 line-through">
                          ₹{p.originalPrice.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    <Link
                      href={`/product/${p.slug}`}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                    >
                      View Full Specs
                    </Link>

                    {bestOffer && (
                      <Link
                        href={`/go/${marketplaceSlug}/${redirectSlug}`}
                        target="_blank"
                        rel="nofollow noopener sponsored"
                        className="inline-flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors shadow-xs"
                      >
                        <span>Buy on {bestOffer.name}</span>
                        <ExternalLink size={12} />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Specifications Head-to-Head Matrix */}
      {allSpecKeys.length > 0 && (
        <section className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="p-5 sm:p-6 bg-slate-50/80 border-b border-slate-200">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Technical Specifications Comparison
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Side-by-side spec comparison based on official manufacturer disclosures.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                  <th className="p-4 font-bold min-w-[140px]">Feature</th>
                  {products.map((p) => (
                    <th key={p.id} className="p-4 font-bold min-w-[180px]">
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allSpecKeys.map((key, i) => (
                  <tr key={key} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="p-4 font-semibold text-slate-600">{key}</td>
                    {products.map((p) => (
                      <td key={p.id} className="p-4 text-slate-900 font-medium">
                        {p.specifications?.[key] || '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Pros & Cons Comparison */}
      {products.some((p) => (p.pros && p.pros.length > 0) || (p.cons && p.cons.length > 0)) && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">
            Strengths & Watch-Outs
          </h2>
          <div
            className={`grid grid-cols-1 ${
              products.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'
            } gap-6`}
          >
            {products.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs"
              >
                <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
                  {p.name}
                </h3>

                {p.pros && p.pros.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 size={13} className="text-emerald-600" />
                      <span>Key Advantages</span>
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {p.pros.map((pro, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-emerald-500 font-bold">•</span>
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {p.cons && p.cons.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1">
                      <XCircle size={13} className="text-rose-600" />
                      <span>Compromises</span>
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {p.cons.map((con, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-rose-400 font-bold">•</span>
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Editorial Verdict / Analysis */}
      {comparison.content && (
        <section className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
          <div className="flex items-center gap-2">
            <Award size={18} className="text-orange-400" />
            <h2 className="text-lg sm:text-xl font-bold">
              Editorial Takeaway & Buyer Guidance
            </h2>
          </div>
          <div className="text-sm sm:text-base leading-relaxed text-slate-200 whitespace-pre-line">
            {comparison.content}
          </div>
          <div className="pt-2 text-xs text-slate-400 border-t border-slate-800">
            Note: Conclusions are derived solely from documented product specifications, lab tests, and live marketplace pricing.
          </div>
        </section>
      )}

      {/* Related Buying Guides */}
      {relatedGuides.length > 0 && (
        <section className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">
              Related Buying Guides
            </h2>
            <Link
              href="/guides"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>View All Guides</span>
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

      {/* Similar Products */}
      {relatedProducts.length > 0 && (
        <section className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">
              Alternative Options
            </h2>
            <Link
              href={`/category/${primaryCategory}`}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>Explore Category</span>
              <ArrowRight size={13} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
