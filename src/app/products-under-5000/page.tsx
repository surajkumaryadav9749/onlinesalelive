import React from 'react';
import type { Metadata } from 'next';
import {
  getProductsUnderPrice,
  getAllGuides,
  getAllCategories,
} from '@/lib/data-service';
import { PriceRangeView } from '@/components/products/PriceRangeView';

import { createPriceRangeMetadata } from '@/lib/seo';

export const revalidate = 60;

export const metadata: Metadata = createPriceRangeMetadata(
  5000,
  'Elevated Build Quality & Premier Brands',
  'Discover mid-tier luxury watches, designer footwear, air fryers, and audio peripherals under ₹5000 across Amazon, Flipkart, Myntra, and AJIO.'
);

export default async function ProductsUnder5000Page() {
  const [products, guides, categories] = await Promise.all([
    getProductsUnderPrice(5000),
    getAllGuides(),
    getAllCategories(),
  ]);

  return (
    <PriceRangeView
      maxPrice={5000}
      title="High-Utility Electronics & Fashion Under ₹5000"
      subtitle="Elevated Build Quality, Longer Warranties & Premier Brands"
      introText="Discover sophisticated analog chronographs, premium athletic sneakers, high-power kitchen air fryers, and high-performance audio peripherals under ₹5000."
      initialProducts={products}
      relatedGuides={guides.slice(0, 3)}
      relatedCategories={categories.slice(0, 4)}
    />
  );
}
