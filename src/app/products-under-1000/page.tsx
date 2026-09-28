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
  1000,
  'TWS Earbuds, Fashion & Shoes',
  'Best-selling ANC earbuds, stretch denim jeans, casual sneakers, and smart home gadgets under ₹1000 with multi-store price comparisons.'
);

export default async function ProductsUnder1000Page() {
  const [products, guides, categories] = await Promise.all([
    getProductsUnderPrice(1000),
    getAllGuides(),
    getAllCategories(),
  ]);

  return (
    <PriceRangeView
      maxPrice={1000}
      title="Top Deals Under ₹1000"
      subtitle="The Sweet Spot: Premium Comfort, TWS Audio & Branded Apparel"
      introText="The ₹1000 price point offers the perfect intersection of brand reliability and immense value. Explore hand-picked active noise cancellation earbuds, comfortable sneakers, and branded clothing."
      initialProducts={products}
      relatedGuides={guides.slice(0, 3)}
      relatedCategories={categories.slice(0, 4)}
    />
  );
}
