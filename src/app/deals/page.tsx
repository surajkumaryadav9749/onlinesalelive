import React from 'react';
import type { Metadata } from 'next';
import { getAllDeals, getPopularDeals, getExpiringDeals } from '@/lib/data-service';
import { DealsPageClient } from './DealsPageClient';

import { buildCanonicalUrl } from '@/lib/seo';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'All Deals & Special Offers across Top Indian Stores | OnlineSaleLive',
  description:
    'Discover lightning offers, price drops, and clearance sales across Amazon, Flipkart, Myntra, AJIO and Meesho with real-time verified discounts.',
  alternates: {
    canonical: buildCanonicalUrl('/deals'),
  },
  openGraph: {
    title: 'All Deals & Special Offers across Top Indian Stores | OnlineSaleLive',
    description:
      'Discover lightning offers, price drops, and clearance sales across Amazon, Flipkart, Myntra, AJIO and Meesho with real-time verified discounts.',
    url: buildCanonicalUrl('/deals'),
    siteName: 'OnlineSaleLive',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'All Deals & Special Offers across Top Indian Stores | OnlineSaleLive',
    description:
      'Discover lightning offers, price drops, and clearance sales across Amazon, Flipkart, Myntra, AJIO and Meesho with real-time verified discounts.',
  },
};

export default async function DealsPage() {
  const [deals, popularDealsRes, expiringDeals] = await Promise.all([
    getAllDeals(),
    getPopularDeals({ limit: 4, days: 7 }),
    getExpiringDeals(72, 4),
  ]);

  return (
    <DealsPageClient
      initialDeals={deals}
      popularDeals={popularDealsRes.deals}
      expiringDeals={expiringDeals}
    />
  );
}
