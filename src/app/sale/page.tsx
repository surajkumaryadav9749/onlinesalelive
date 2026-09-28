import React from 'react';
import Link from 'next/link';
import { getAllProducts, getAllCategories } from '@/lib/data-service';
import { ProductCard } from '@/components/products/ProductCard';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Tag, Sparkles, ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';
import { buildCanonicalUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Festive & Clearance Sale Events — Up to 75% Off | OnlineSaleLive',
  description:
    'Browse verified sale items and clearance discounts across electronics, footwear, grooming, and apparel from Amazon, Flipkart, Myntra, and AJIO.',
  alternates: {
    canonical: buildCanonicalUrl('/sale'),
  },
  openGraph: {
    title: 'Festive & Clearance Sale Events — Up to 75% Off | OnlineSaleLive',
    description:
      'Browse verified sale items and clearance discounts across electronics, footwear, grooming, and apparel from Amazon, Flipkart, Myntra, and AJIO.',
    url: buildCanonicalUrl('/sale'),
    siteName: 'OnlineSaleLive',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Festive & Clearance Sale Events — Up to 75% Off | OnlineSaleLive',
    description:
      'Browse verified sale items and clearance discounts across electronics, footwear, grooming, and apparel from Amazon, Flipkart, Myntra, and AJIO.',
  },
};

export default async function SalePage() {
  const [products, categories] = await Promise.all([
    getAllProducts(),
    getAllCategories(),
  ]);

  // Group products by category
  const categoriesWithProducts = categories.map((cat) => ({
    ...cat,
    products: products.filter(
      (p) => p.categorySlug.toLowerCase() === cat.slug.toLowerCase()
    ),
  })).filter((cat) => cat.products.length > 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">
      <Breadcrumbs items={[{ label: 'Sale' }]} />

      {/* Sale Banner */}
      <div className="bg-linear-to-r from-red-600 via-rose-600 to-orange-600 text-white rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
            <Sparkles size={14} />
            <span>Mega Clearance & Seasonal Sale</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-2">
            Festive & Clearance Sale Events
          </h1>
          <p className="text-rose-100 text-sm sm:text-base leading-relaxed">
            Browse verified sale items grouped by category. Grab up to 75% savings on top electronics, footwear, grooming, and everyday essentials.
          </p>
        </div>
      </div>

      {/* Categories Grouped Showcase */}
      {categoriesWithProducts.length > 0 ? (
        <div className="space-y-12">
          {categoriesWithProducts.map((cat) => (
            <section key={cat.id} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Tag size={18} className="text-orange-600" />
                  <h2 className="text-xl font-bold text-slate-900">{cat.name} Sale</h2>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {cat.products.length} Items
                  </span>
                </div>
                <Link
                  href={`/category/${cat.slug}`}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <span>View All {cat.name}</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {cat.products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 max-w-xl mx-auto shadow-xs">
          <Tag size={32} className="mx-auto text-slate-400 mb-3" />
          <p className="text-base text-slate-700 font-semibold">No active sale items right now.</p>
          <p className="text-xs text-slate-400 mt-1">Festive and clearance sale items will appear as promotions go live across stores.</p>
        </div>
      )}
    </div>
  );
}
