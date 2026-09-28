import type { Metadata } from 'next';
import { buildCanonicalUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Contact Us | OnlineSaleLive Support & Partnerships',
  description:
    'Get in touch with the OnlineSaleLive team for general queries, deal submissions, corrections, or partnership inquiries.',
  alternates: {
    canonical: buildCanonicalUrl('/contact'),
  },
  openGraph: {
    title: 'Contact Us | OnlineSaleLive Support & Partnerships',
    description:
      'Get in touch with the OnlineSaleLive team for general queries, deal submissions, corrections, or partnership inquiries.',
    url: buildCanonicalUrl('/contact'),
    siteName: 'OnlineSaleLive',
    locale: 'en_IN',
    type: 'website',
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
