import type { Metadata } from 'next';
import { Product, Guide, Review, BlogPost, Category, ComparisonItem } from '@/types';

/**
 * Returns the configured base URL for the site.
 * Defaults to 'https://onlinesalelive.in' in production.
 */
export function getBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/+$/, '');
  }
  return 'https://onlinesalelive.in';
}

/**
 * Safely constructs an absolute canonical URL.
 */
export function buildCanonicalUrl(path: string): string {
  const base = getBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  // Strip trailing slashes except for root
  const normalizedPath = cleanPath.length > 1 && cleanPath.endsWith('/') ? cleanPath.slice(0, -1) : cleanPath;
  return `${base}${normalizedPath}`;
}

/**
 * Serializes JSON-LD safely to prevent XSS / script breakage.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

/**
 * WebSite schema with SearchAction
 */
export function generateWebSiteSchema() {
  const baseUrl = getBaseUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'OnlineSaleLive',
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Truthful Organization schema for OnlineSaleLive
 */
export function generateOrganizationSchema() {
  const baseUrl = getBaseUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'OnlineSaleLive',
    url: baseUrl,
    logo: `${baseUrl}/icon.png`,
    description: 'Independent Indian online shopping discovery, verified deals, and multi-store price comparisons.',
  };
}

/**
 * BreadcrumbList schema
 */
export function generateBreadcrumbSchema(items: { label: string; href?: string }[]) {
  const baseUrl = getBaseUrl();
  const itemListElement = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: baseUrl,
    },
    ...items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 2,
      name: item.label,
      ...(item.href ? { item: item.href.startsWith('http') ? item.href : `${baseUrl}${item.href}` } : {}),
    })),
  ];

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement,
  };
}

/**
 * Product schema with accurate visible Offers
 */
export function generateProductSchema(product: Product) {
  const baseUrl = getBaseUrl();
  const productUrl = `${baseUrl}/product/${product.slug}`;

  // Filter valid in-stock marketplace offers
  const validOffers = (product.marketplaces || [])
    .filter((m) => m.price !== null && m.inStock && m.isActive !== false)
    .map((m) => ({
      '@type': 'Offer',
      price: m.price,
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      url: productUrl, // Point to product page, NOT raw affiliate redirect
      seller: {
        '@type': 'Organization',
        name: m.name,
      },
    }));

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || `${product.name} deals and prices across Indian online stores.`,
    image: product.image ? [product.image] : [],
    url: productUrl,
  };

  // Only include aggregateRating if product has legitimate rating and reviewCount
  if (product.rating && product.reviewCount && product.reviewCount > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  if (validOffers.length > 0) {
    schema.offers = validOffers.length === 1 ? validOffers[0] : {
      '@type': 'AggregateOffer',
      priceCurrency: 'INR',
      lowPrice: Math.min(...validOffers.map((o) => o.price as number)),
      highPrice: Math.max(...validOffers.map((o) => o.price as number)),
      offerCount: validOffers.length,
      offers: validOffers,
    };
  } else if (product.price > 0) {
    schema.offers = {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      url: productUrl,
    };
  }

  return schema;
}

/**
 * Article schema for Guides and Blog Posts
 */
export function generateArticleSchema(params: {
  title: string;
  description: string;
  url: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  authorName?: string;
}) {
  const baseUrl = getBaseUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: params.title,
    description: params.description,
    url: params.url,
    ...(params.image ? { image: [params.image] } : {}),
    ...(params.datePublished ? { datePublished: params.datePublished } : {}),
    ...(params.dateModified ? { dateModified: params.dateModified } : {}),
    author: {
      '@type': 'Person',
      name: params.authorName || 'OnlineSaleLive Editorial Team',
    },
    publisher: {
      '@type': 'Organization',
      name: 'OnlineSaleLive',
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/icon.png`,
      },
    },
  };
}

/**
 * Reusable metadata helpers for dynamic pages
 */
export function createProductMetadata(product: Product): Metadata {
  const canonical = buildCanonicalUrl(`/product/${product.slug}`);
  const title = `${product.name} — Price, Deals & Offers | OnlineSaleLive`;
  const description = product.description
    ? `${product.description.slice(0, 140)}... Compare prices across Amazon, Flipkart, Myntra, and more on OnlineSaleLive.`
    : `Compare prices for ${product.name} across Amazon, Flipkart, Myntra, AJIO, and Meesho. Starting at ₹${product.price.toLocaleString('en-IN')}.`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'OnlineSaleLive',
      locale: 'en_IN',
      type: 'website',
      images: product.image ? [{ url: product.image, alt: product.name }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: product.image ? [product.image] : undefined,
    },
  };
}

export function createCategoryMetadata(category: Category): Metadata {
  const canonical = buildCanonicalUrl(`/category/${category.slug}`);
  const title = `${category.name} Deals, Offers & Best Prices | OnlineSaleLive`;
  const description = category.description || `Discover handpicked ${category.name} deals and store price comparisons on OnlineSaleLive.`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'OnlineSaleLive',
      locale: 'en_IN',
      type: 'website',
      images: category.image ? [{ url: category.image, alt: category.name }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: category.image ? [category.image] : undefined,
    },
  };
}

export function createGuideMetadata(guide: Guide): Metadata {
  const canonical = buildCanonicalUrl(`/guides/${guide.slug}`);
  const title = `${guide.title} | OnlineSaleLive`;
  const description = guide.excerpt || `Read our comprehensive buying guide on ${guide.title} to find top picks and buying advice.`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'OnlineSaleLive',
      locale: 'en_IN',
      type: 'article',
      images: guide.image ? [{ url: guide.image, alt: guide.title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: guide.image ? [guide.image] : undefined,
    },
  };
}

export function createReviewMetadata(review: Review): Metadata {
  const canonical = buildCanonicalUrl(`/reviews/${review.slug}`);
  const title = `${review.title} Review & Verdict | OnlineSaleLive`;
  const description = review.verdict || `Read in-depth review, pros, cons, and performance verdict for ${review.productName}.`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'OnlineSaleLive',
      locale: 'en_IN',
      type: 'article',
      images: review.image ? [{ url: review.image, alt: review.title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: review.image ? [review.image] : undefined,
    },
  };
}

export function createComparisonMetadata(comparison: ComparisonItem | { title: string; slug: string; description?: string; image?: string; seoTitle?: string; seoDescription?: string }): Metadata {
  const canonical = buildCanonicalUrl(`/compare/${comparison.slug}`);
  const title = comparison.seoTitle || `${comparison.title} | Head-to-Head Comparison | OnlineSaleLive`;
  const description =
    comparison.seoDescription ||
    comparison.description ||
    `Compare specifications, features, strengths and weaknesses, and live marketplace deals between ${comparison.title}.`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'OnlineSaleLive',
      locale: 'en_IN',
      type: 'article',
      images: comparison.image ? [{ url: comparison.image, alt: comparison.title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: comparison.image ? [comparison.image] : undefined,
    },
  };
}

export function createBlogPostMetadata(post: BlogPost): Metadata {
  const canonical = buildCanonicalUrl(`/blog/${post.slug}`);
  const title = `${post.title} | OnlineSaleLive`;
  const description = post.excerpt || `Read article on ${post.title} covering online shopping insights, saving tips, and deal roundups.`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'OnlineSaleLive',
      locale: 'en_IN',
      type: 'article',
      images: post.image ? [{ url: post.image, alt: post.title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: post.image ? [post.image] : undefined,
    },
  };
}

export function createPriceRangeMetadata(maxPrice: number, subtitle: string, description: string): Metadata {
  const canonical = buildCanonicalUrl(`/products-under-${maxPrice}`);
  const title = `Best Products Under ₹${maxPrice} in India — Top Deals & Offers | OnlineSaleLive`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'OnlineSaleLive',
      locale: 'en_IN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}
