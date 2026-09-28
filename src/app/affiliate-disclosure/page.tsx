import React from 'react';
import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { ShieldAlert, Info, CheckCircle2, HelpCircle } from 'lucide-react';

import { buildCanonicalUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Affiliate Disclosure | OnlineSaleLive Transparency Policy',
  description:
    'Full transparency disclosure regarding our affiliate partnerships, marketplace deep links, and editorial independence.',
  alternates: {
    canonical: buildCanonicalUrl('/affiliate-disclosure'),
  },
};

export default function AffiliateDisclosurePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">
      <Breadcrumbs items={[{ label: 'Affiliate Disclosure' }]} />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
            <ShieldAlert size={14} />
            <span>Transparency Statement</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-2">
            Affiliate Disclosure
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Our commitment to complete openness regarding referral partnerships, retail links, and how we sustain our editorial research.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-2xs space-y-8 text-slate-700 text-sm sm:text-base leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">
            How OnlineSaleLive Operates
          </h2>
          <p>
            <strong>OnlineSaleLive (onlinesalelive.in)</strong> is an independent deal-discovery, price-comparison, and buyer-research website serving shoppers in India. Our mission is to help consumers find verified deals, compare prices across major stores, and make informed purchasing decisions without deceptive marketing or intrusive popup advertisements.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">
            Distinction Between Standard Links & Affiliate Links
          </h2>
          <p>
            To maintain full transparency with our readers, we clearly distinguish between standard marketplace links and authorized affiliate links:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                <span>Standard Marketplace Links</span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Many store links on OnlineSaleLive are direct, non-affiliated references to retail listings provided for price comparison convenience. OnlineSaleLive receives no financial compensation when you visit these links.
              </p>
            </div>
            <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-1.5">
              <h3 className="font-bold text-emerald-950 text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                <span>Affiliate & Deep Referral Links</span>
              </h3>
              <p className="text-xs text-emerald-900 leading-relaxed">
                Where an authorized affiliate program or referral partnership is configured, clicking an outbound link may result in OnlineSaleLive earning a small referral fee from qualifying purchases.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">
            Affiliate Programs & Partner Networks
          </h2>
          <p>
            OnlineSaleLive may participate in authorized affiliate marketing programs and affiliate networks in India, which may include:
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {[
              'Amazon Associates Program (Amazon India)',
              'Flipkart Affiliate Program',
              'Myntra Partner Network',
              'AJIO & Reliance Retail Programs',
              'Meesho Referral & Reseller Integrations',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-slate-500 pt-1">
            Note: Commission rates differ widely across individual product categories, retail programs, promotional schedules, and seasonal campaigns. We do not represent or guarantee fixed commission percentages.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">
            Zero Extra Cost to the Consumer
          </h2>
          <p>
            Clicking on any link on OnlineSaleLive — whether a standard link or an affiliate referral link — never increases the price you pay. In fact, our deals research is dedicated to highlighting discounts, coupons, and verified price drops so you pay the lowest available price.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">
            Editorial Independence & Integrity
          </h2>
          <p>
            Our product selections, buying recommendations, pros and cons lists, and reviews are prepared independently by our editorial team based on product specifications, verified customer feedback, and comparative analysis. Merchants and brands cannot pay for favorable rankings, unearned scores, or deceptive endorsements.
          </p>
        </section>

        <section className="space-y-3 bg-amber-50 rounded-2xl p-5 border border-amber-200 text-xs text-amber-950">
          <div className="flex items-center gap-2 font-bold text-amber-900 text-sm mb-1">
            <Info size={16} className="text-amber-700" />
            <span>Price & Availability Fluctuation Notice</span>
          </div>
          <p>
            Retail prices, original MRPs, flash coupons, and stock availability on external e-commerce platforms fluctuate rapidly due to retailer pricing algorithms. Stored pricing data on OnlineSaleLive represents prices recorded during research. The actual final price, shipping conditions, and return policies are determined solely by the destination retailer at checkout.
          </p>
        </section>

        <div className="pt-2 text-xs text-slate-400 border-t border-slate-100 flex items-center gap-1.5">
          <HelpCircle size={14} />
          <span>If you have questions regarding our affiliate transparency policy, please reach out via our contact page.</span>
        </div>
      </div>
    </div>
  );
}
