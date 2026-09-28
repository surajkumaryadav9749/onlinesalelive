import React from 'react';
import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { FileText, AlertTriangle } from 'lucide-react';

import { buildCanonicalUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Terms of Service | OnlineSaleLive User Agreement',
  description:
    'Terms and conditions governing the use of the OnlineSaleLive deals and price comparison platform.',
  alternates: {
    canonical: buildCanonicalUrl('/terms'),
  },
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">
      <Breadcrumbs items={[{ label: 'Terms of Service' }]} />

      {/* Header Banner */}
      <div className="bg-linear-to-r from-slate-900 via-slate-850 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
            <FileText size={14} />
            <span>Usage Agreement</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-2">
            Terms of Service
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Please read these terms and conditions carefully before utilizing our deal aggregation and comparison services.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-2xs space-y-8 text-slate-700 text-sm sm:text-base leading-relaxed">
        <div className="text-xs text-slate-500 pb-2 border-b border-slate-100">
          Effective Date: September 2026
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing or using <strong>OnlineSaleLive (onlinesalelive.in)</strong>, you agree to be bound by these Terms of Service and all applicable Indian laws and regulations. If you do not agree with any part of these terms, please discontinue using this website.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">
            2. Scope of Service & Informational Nature
          </h2>
          <p>
            OnlineSaleLive operates as a free, consumer-oriented deal aggregation, product discovery, and comparison resource. We are an independent publishing portal, not an online seller, manufacturer, or merchant of record.
          </p>
          <p>
            We do not sell items directly, process payment gateways, dispatch shipments, or manage product warranties. All transactions take place directly on third-party retailer platforms (e.g., Amazon India, Flipkart, Myntra, etc.).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">
            3. Disclaimer on Pricing & Deal Accuracy
          </h2>
          <p>
            While we strive to ensure that all deal parameters, discount percentages, and specifications published on our website are accurate and fresh at the time of publication, retail prices across Indian marketplaces fluctuate in real time based on demand and retailer promotions.
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 flex items-start gap-2.5">
            <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <span>
              The verified price, shipping fee, return policy, and product warranty stated on the checkout page of the destination merchant always supersede any information listed on OnlineSaleLive.
            </span>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">
            4. Intellectual Property Rights
          </h2>
          <p>
            The original editorial reviews, buying guides, comparison charts, logos, site layout, and custom design code of OnlineSaleLive are protected by copyright and intellectual property laws. Product images, brand names, and third-party trademarks belong to their respective owners and are referenced solely for identification and comparison purposes under fair use.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">
            5. Limitation of Liability
          </h2>
          <p>
            OnlineSaleLive and its operators shall not be held liable for any direct, indirect, incidental, or consequential damages resulting from product purchases, delivery disputes, merchant cancellations, or transactions completed on third-party marketplace websites.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">
            6. Changes to Terms
          </h2>
          <p>
            We reserve the right to revise or update these terms at our sole discretion. Your continued use of the website following any modifications signifies your acceptance of the updated terms.
          </p>
        </section>
      </div>
    </div>
  );
}
