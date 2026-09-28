import React from 'react';
import { getAllDeals } from '@/lib/data-service';
import { DealCard } from '@/components/deals/DealCard';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Clock } from 'lucide-react';
import type { Metadata } from 'next';
import { buildCanonicalUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: "Today's Best Shopping Deals & Flash Discounts | OnlineSaleLive",
  description:
    'Exclusive 24-hour deals, lightning offers, and price drops with lowest pricing across Amazon, Flipkart, Myntra, AJIO, and Meesho.',
  alternates: {
    canonical: buildCanonicalUrl('/todays-deals'),
  },
  openGraph: {
    title: "Today's Best Shopping Deals & Flash Discounts | OnlineSaleLive",
    description:
      'Exclusive 24-hour deals, lightning offers, and price drops with lowest pricing across Amazon, Flipkart, Myntra, AJIO, and Meesho.',
    url: buildCanonicalUrl('/todays-deals'),
    siteName: 'OnlineSaleLive',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Today's Best Shopping Deals & Flash Discounts | OnlineSaleLive",
    description:
      'Exclusive 24-hour deals, lightning offers, and price drops with lowest pricing across Amazon, Flipkart, Myntra, AJIO, and Meesho.',
  },
};

export default async function TodaysDealsPage() {
  const deals = await getAllDeals();
  const todaysDeals = deals.filter((d) => d.dealType === "Today's Deal");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      <Breadcrumbs items={[{ label: "Today's Deals" }]} />

      {/* Hero */}
      <div className="bg-linear-to-r from-red-600 via-rose-600 to-orange-600 text-white rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
            <Clock size={14} className="animate-spin" />
            <span>Updated Every Morning</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-2">
            Today&apos;s Best Shopping Deals
          </h1>
          <p className="text-red-100 text-sm sm:text-base leading-relaxed">
            Exclusive 24-hour deals and price drops with guaranteed lowest pricing on popular products across India.
          </p>
        </div>
      </div>

      {/* Deals Grid */}
      {deals.length > 0 ? (
        <>
          {todaysDeals.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                  <h2 className="text-xl font-bold text-slate-900">Live Today&apos;s Deals</h2>
                </div>
                <span className="text-xs text-slate-500 font-semibold">
                  {todaysDeals.length} active deals today
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {todaysDeals.map((deal) => (
                  <DealCard key={deal.id} deal={deal} />
                ))}
              </div>
            </div>
          )}

          {/* Other Ongoing Offers */}
          {deals.filter((d) => d.dealType !== "Today's Deal").length > 0 && (
            <div className="pt-8 border-t border-slate-200 space-y-4">
              <h3 className="text-lg font-bold text-slate-900">
                More Flash Deals & Active Discounts
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {deals
                  .filter((d) => d.dealType !== "Today's Deal")
                  .slice(0, 4)
                  .map((deal) => (
                    <DealCard key={deal.id} deal={deal} />
                  ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 max-w-xl mx-auto shadow-xs">
          <Clock size={32} className="mx-auto text-slate-400 mb-3" />
          <p className="text-base text-slate-700 font-semibold">No active deals today right now.</p>
          <p className="text-xs text-slate-400 mt-1">Our deal hunters refresh offers every morning. Check back soon for fresh drops.</p>
        </div>
      )}
    </div>
  );
}
