import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import {
  getBaseUrl,
  generateWebSiteSchema,
  generateOrganizationSchema,
  serializeJsonLd,
} from '@/lib/seo';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'OnlineSaleLive | Best Deals, Sales & Discounts in India',
    template: '%s | OnlineSaleLive',
  },
  description:
    'Discover verified deals, mega festive sales, product comparisons, and lowest prices across Amazon, Flipkart, Myntra, AJIO, and Meesho.',
  keywords: [
    'online sale live',
    'deals india',
    'amazon deals',
    'flipkart sale',
    'myntra discounts',
    'best price comparison',
    'products under 500',
    'products under 1000',
    'buying guides india',
  ],
  metadataBase: new URL(getBaseUrl()),
  openGraph: {
    title: 'OnlineSaleLive | Best Deals, Sales & Discounts in India',
    description:
      'Compare prices across Amazon, Flipkart, Myntra, AJIO, and Meesho. Handpicked deals, price drop alerts, and buying guides.',
    url: getBaseUrl(),
    siteName: 'OnlineSaleLive',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OnlineSaleLive | Best Deals, Sales & Discounts in India',
    description:
      'Compare prices across Amazon, Flipkart, Myntra, AJIO, and Meesho. Handpicked deals, price drop alerts, and buying guides.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const websiteSchema = generateWebSiteSchema();
  const organizationSchema = generateOrganizationSchema();

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(organizationSchema) }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <main className="flex-1 w-full">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
