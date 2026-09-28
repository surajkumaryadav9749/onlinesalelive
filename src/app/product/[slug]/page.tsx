import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getAllProducts,
  getProductBySlug,
  getRelatedProducts,
  getRelatedContent,
} from '@/lib/data-service';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { RatingStars } from '@/components/ui/RatingStars';
import { DealBadge } from '@/components/ui/DealBadge';
import { MarketplaceComparison } from '@/components/products/MarketplaceComparison';
import { ProductCard } from '@/components/products/ProductCard';
import { RelatedContentSection } from '@/components/content/RelatedContentSection';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  GitCompare,
  ArrowRight,
} from 'lucide-react';
import type { Metadata } from 'next';

import {
  createProductMetadata,
  generateProductSchema,
  serializeJsonLd,
} from '@/lib/seo';

export const revalidate = 60;
export const dynamicParams = true;

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map((p) => ({
    slug: p.slug,
  }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: 'Product Not Found | OnlineSaleLive',
      robots: { index: false, follow: false },
    };
  }

  return createProductMetadata(product);
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const [relatedProducts, relatedContent] = await Promise.all([
    getRelatedProducts(product.categorySlug, product.slug, 4, product.price),
    getRelatedContent({ productSlug: product.slug, categorySlug: product.categorySlug, limit: 3 }),
  ]);

  const productSchema = generateProductSchema(product);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12">
      {/* Product JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(productSchema) }}
      />

      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Products', href: '/products' },
          { label: product.category, href: `/category/${product.categorySlug}` },
          { label: product.name },
        ]}
      />

      {/* Main Product Showcase Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Image Area */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="relative w-full pt-[90%] bg-slate-50 rounded-2xl overflow-hidden">
            <Image
              src={
                product.image && product.image.trim() !== ''
                  ? product.image
                  : `https://placehold.co/600x400/f1f5f9/475569?text=${encodeURIComponent(
                      product.name.slice(0, 20)
                    )}`
              }
              alt={product.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-contain p-4"
            />
            {product.discountPercent > 0 && (
              <span className="absolute top-3 left-3 bg-red-600 text-white font-black text-sm px-2.5 py-1 rounded-lg shadow-sm">
                {product.discountPercent}% OFF
              </span>
            )}
            <div className="absolute top-3 right-3">
              <DealBadge type={product.dealType} size="sm" />
            </div>
          </div>

          {/* Quick trust reassurance */}
          <div className="grid grid-cols-2 gap-2 pt-2 text-xs text-slate-500">
            <div className="flex items-center gap-1.5 p-2 bg-slate-50 rounded-lg">
              <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
              <span>Verified Retail Partners</span>
            </div>
            <div className="flex items-center gap-1.5 p-2 bg-slate-50 rounded-lg">
              <Clock size={16} className="text-orange-600 shrink-0" />
              <span>Real-Time Price Sync</span>
            </div>
          </div>
        </div>

        {/* Right Column: Title, Prices, Specs & Actions */}
        <div className="lg:col-span-7 space-y-6">
          {/* Header Info */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link
                href={`/category/${product.categorySlug}`}
                className="text-xs font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full hover:bg-orange-100 transition-colors"
              >
                {product.category}
              </Link>
              {product.badgeText && (
                <span className="text-xs font-semibold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">
                  {product.badgeText}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
              {product.name}
            </h1>

            <div className="mt-3 flex items-center gap-4">
              <RatingStars rating={product.rating} reviewCount={product.reviewCount} size="md" />
              <span className="text-slate-300">|</span>
              <span className="text-xs text-slate-500">Verified Deal Score</span>
            </div>
          </div>

          {/* Price Box */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-slate-900">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              {product.originalPrice > product.price && (
                <span className="text-base text-slate-400 line-through">
                  ₹{product.originalPrice.toLocaleString('en-IN')}
                </span>
              )}
              <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                Save ₹{(product.originalPrice - product.price).toLocaleString('en-IN')} ({product.discountPercent}%)
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Inclusive of all taxes. Free delivery may apply depending on marketplace terms and prime membership.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                href={`/compare?productA=${product.slug}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl transition-colors"
              >
                <GitCompare size={14} />
                <span>Compare with other models</span>
              </Link>
            </div>
          </div>

          {/* Short Description */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Overview
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Pros & Cons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-4 space-y-2">
              <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>What&apos;s Great</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-emerald-950">
                {product.pros.map((pro, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{pro}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-rose-50/50 border border-rose-200 rounded-2xl p-4 space-y-2">
              <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                <XCircle size={16} className="text-rose-600" />
                <span>Keep In Mind</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-rose-950">
                {product.cons.map((con, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-rose-400 font-bold">•</span>
                    <span>{con}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MARKETPLACE PRICE COMPARISON SECTION */}
      <section className="space-y-4 pt-4">
        <MarketplaceComparison
          marketplaces={product.marketplaces}
          productName={product.name}
          productSlug={product.slug}
        />
      </section>

      {/* 3. KEY SPECIFICATIONS TABLE */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-2xs">
        <h3 className="text-lg font-bold text-slate-900">
          Key Specifications & Features
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          {Object.entries(product.specifications).map(([key, val]) => (
            <div
              key={key}
              className="flex items-center justify-between py-2 border-b border-slate-100 text-xs sm:text-sm"
            >
              <span className="text-slate-500 font-medium">{key}</span>
              <span className="text-slate-900 font-semibold text-right">{val}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 4. CONTEXTUAL RELATED CONTENT */}
      <RelatedContentSection
        title={`Buying Research for ${product.name}`}
        subtitle="Explore verified buying guides, editorial reviews, side-by-side comparisons, and active deals"
        guides={relatedContent.guides}
        reviews={relatedContent.reviews}
        comparisons={relatedContent.comparisons}
        deals={relatedContent.deals}
      />

      {/* 5. RELATED PRODUCTS */}
      {relatedProducts.length > 0 && (
        <section className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900">
              Similar Products in {product.category}
            </h3>
            <Link
              href={`/category/${product.categorySlug}`}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight size={14} />
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
