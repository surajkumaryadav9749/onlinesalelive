import React, { Suspense } from 'react';
import { getAllProducts, getAllCategories } from '@/lib/data-service';
import { ProductsPageClient } from './ProductsPageClient';
import type { Metadata } from 'next';
import { buildCanonicalUrl } from '@/lib/seo';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'All Products & Best Deals Across Stores | OnlineSaleLive',
  description:
    'Search and filter all products across Amazon, Flipkart, Myntra, AJIO, and Meesho. Compare prices, discounts, and ratings.',
  alternates: {
    canonical: buildCanonicalUrl('/products'),
  },
  openGraph: {
    title: 'All Products & Best Deals Across Stores | OnlineSaleLive',
    description:
      'Search and filter all products across Amazon, Flipkart, Myntra, AJIO, and Meesho. Compare prices, discounts, and ratings.',
    url: buildCanonicalUrl('/products'),
    siteName: 'OnlineSaleLive',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'All Products & Best Deals Across Stores | OnlineSaleLive',
    description:
      'Search and filter all products across Amazon, Flipkart, Myntra, AJIO, and Meesho. Compare prices, discounts, and ratings.',
  },
};

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([
    getAllProducts(),
    getAllCategories(),
  ]);

  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-500 text-sm">Loading product catalog...</div>}>
      <ProductsPageClient initialProducts={products} categories={categories} />
    </Suspense>
  );
}
