import React from 'react';
import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { ShieldCheck, Lock, Eye, Cookie } from 'lucide-react';

import { buildCanonicalUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Privacy Policy | OnlineSaleLive',
  description:
    'Learn how OnlineSaleLive handles visitor privacy, cookies, analytics, and third-party affiliate links.',
  alternates: {
    canonical: buildCanonicalUrl('/privacy-policy'),
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">
      <Breadcrumbs items={[{ label: 'Privacy Policy' }]} />

      {/* Header Banner */}
      <div className="bg-linear-to-r from-slate-900 via-slate-850 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
            <Lock size={14} />
            <span>Data Protection</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-2">
            Privacy Policy
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Your privacy matters to us. This policy describes how OnlineSaleLive respects and protects your information.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-2xs space-y-8 text-slate-700 text-sm sm:text-base leading-relaxed">
        <div className="text-xs text-slate-500 pb-2 border-b border-slate-100">
          Last Updated: September 2026
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Eye size={20} className="text-orange-600" />
            <span>1. Information We Do Not Collect</span>
          </h2>
          <p>
            OnlineSaleLive is designed to be browsed freely without requiring user accounts, passwords, or personal financial details. We do not process payments, store credit card credentials, or collect personal billing addresses.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Cookie size={20} className="text-orange-600" />
            <span>2. Cookies & Anonymous Analytics</span>
          </h2>
          <p>
            Like standard web services, we may use standard browser cookies and aggregated telemetry tools (such as privacy-centric page view analytics) to understand which deal categories and search terms are most popular. These metrics contain no personally identifiable information (PII).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck size={20} className="text-orange-600" />
            <span>3. Third-Party Retailer Links</span>
          </h2>
          <p>
            When you click outbound merchant links to Amazon, Flipkart, Myntra, AJIO, or Meesho, you are redirected to third-party retail destinations. These external stores have their own distinct privacy policies and security mechanisms. We encourage you to review their terms upon entering their respective platforms.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">
            4. Newsletter & Voluntary Communications
          </h2>
          <p>
            If you voluntarily provide your email address to receive deal alerts or submit an inquiry through our contact form, we use your address solely to respond to your request or dispatch the requested deal updates. We do not sell or trade your email address to spam syndicates.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">
            5. Contact for Privacy Inquiries
          </h2>
          <p>
            For questions or feedback regarding this Privacy Policy, please reach out through our contact desk at{' '}
            <a href="mailto:privacy@onlinesalelive.in" className="text-orange-600 hover:underline font-semibold">
              privacy@onlinesalelive.in
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
