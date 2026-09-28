import React from 'react';
import type { Metadata } from 'next';
import {
  getProductsUnderPrice,
  getAllGuides,
  getAllCategories,
} from '@/lib/data-service';
import { PriceRangeView } from '@/components/products/PriceRangeView';

import { createPriceRangeMetadata } from '@/lib/seo';

export const metadata: Metadata = createPriceRangeMetadata(
  2000,
  'Smartwatches, Running Shoes & Audio',
  'Find top-rated AMOLED smartwatches, cushioned running shoes, fast chargers, and kitchen appliances under ₹2000 with multi-store comparisons.'
);

export default async function ProductsUnder2000Page() {
  const [products, guides, categories] = await Promise.all([
    getProductsUnderPrice(2000),
    getAllGuides(),
    getAllCategories(),
  ]);

  return (
    <PriceRangeView
      maxPrice={2000}
      title="Top Value Picks Under ₹2000"
      subtitle="Feature-Packed Smartwatches, Durable Footwear & Modern Appliances"
      introText="Step up your lifestyle with cutting-edge Bluetooth calling smartwatches, durable athletic footwear, and high-efficiency induction appliances—all verified below ₹2000."
      initialProducts={products}
      relatedGuides={guides.slice(0, 3)}
      relatedCategories={categories.slice(0, 4)}
    />
  );
}
