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
  500,
  'Pocket-Friendly Deals',
  'Discover top-rated earphones, cables, t-shirts, kitchenware, and daily essentials under ₹500 across Amazon, Flipkart, Myntra, and Meesho.'
);

export default async function ProductsUnder500Page() {
  const [products, guides, categories] = await Promise.all([
    getProductsUnderPrice(500),
    getAllGuides(),
    getAllCategories(),
  ]);

  return (
    <PriceRangeView
      maxPrice={500}
      title="Best Products Under ₹500"
      subtitle="Super-Value Everyday Essentials, Gadgets & Fashion"
      introText="Explore verified bargains under ₹500 across top Indian marketplaces. From durable charging cables and wired earphones to comfortable cotton t-shirts, get high utility without stretching your wallet."
      initialProducts={products}
      relatedGuides={guides.slice(0, 3)}
      relatedCategories={categories.slice(0, 4)}
    />
  );
}
