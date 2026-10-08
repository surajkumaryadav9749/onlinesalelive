import { MarketplaceName } from '@/types';

export interface MarketplaceConfig {
  name: MarketplaceName;
  slug: string;
  displayName: string;
  isEnabled: boolean;
  affiliateEnabled: boolean;
  trackingEnabled: boolean;
  baseUrl: string;
  allowedDomains: string[];
}

export const MARKETPLACE_CONFIGS: Record<MarketplaceName, MarketplaceConfig> = {
  Amazon: {
    name: 'Amazon',
    slug: 'amazon',
    displayName: 'Amazon India',
    isEnabled: true,
    affiliateEnabled: true,
    trackingEnabled: true,
    baseUrl: 'https://www.amazon.in',
    allowedDomains: [
      'amazon.in',
      'www.amazon.in',
      'amzn.to',
      'amzn.in',
      'amazon.com',
      'www.amazon.com',
      'link.amazon',
    ],
  },
  Flipkart: {
    name: 'Flipkart',
    slug: 'flipkart',
    displayName: 'Flipkart',
    isEnabled: true,
    affiliateEnabled: true,
    trackingEnabled: true,
    baseUrl: 'https://www.flipkart.com',
    allowedDomains: [
      'flipkart.com',
      'www.flipkart.com',
      'fkrt.it',
      'fkrt.co',
      'dl.flipkart.com',
      'fktr.in',
      'www.fktr.in',
      'trackingv3.linkredirect.in',
    ],
  },
  Myntra: {
    name: 'Myntra',
    slug: 'myntra',
    displayName: 'Myntra',
    isEnabled: true,
    affiliateEnabled: true,
    trackingEnabled: true,
    baseUrl: 'https://www.myntra.com',
    allowedDomains: [
      'myntra.com',
      'www.myntra.com',
      'myntr.it',
    ],
  },
  AJIO: {
    name: 'AJIO',
    slug: 'ajio',
    displayName: 'AJIO',
    isEnabled: true,
    affiliateEnabled: true,
    trackingEnabled: true,
    baseUrl: 'https://www.ajio.com',
    allowedDomains: [
      'ajio.com',
      'www.ajio.com',
      'l.ajio.com',
    ],
  },
  Meesho: {
    name: 'Meesho',
    slug: 'meesho',
    displayName: 'Meesho',
    isEnabled: true,
    affiliateEnabled: true,
    trackingEnabled: true,
    baseUrl: 'https://www.meesho.com',
    allowedDomains: [
      'meesho.com',
      'www.meesho.com',
      'app.meesho.com',
    ],
  },
};

export const SUPPORTED_MARKETPLACES: MarketplaceName[] = [
  'Amazon',
  'Flipkart',
  'Myntra',
  'AJIO',
  'Meesho',
];

/**
 * Find marketplace configuration by display name or slug (case-insensitive)
 */
export function getMarketplaceConfig(nameOrSlug: string): MarketplaceConfig | undefined {
  const normalized = nameOrSlug.trim().toLowerCase();
  for (const config of Object.values(MARKETPLACE_CONFIGS)) {
    if (
      config.name.toLowerCase() === normalized ||
      config.slug.toLowerCase() === normalized
    ) {
      return config;
    }
  }
  return undefined;
}

/**
 * Validate that a URL is a legitimate, HTTPS link pointing strictly to an authorized marketplace domain.
 * Prevents open redirect attacks and domain hijacking.
 */
export function isAllowedMarketplaceUrl(
  marketplace: MarketplaceName | string,
  urlString: string
): boolean {
  if (!urlString || typeof urlString !== 'string') {
    return false;
  }

  const trimmed = urlString.trim();
  if (trimmed === '#' || trimmed === '') {
    return false;
  }

  try {
    const parsed = new URL(trimmed);

    // Enforce HTTPS in production (allow HTTP strictly on localhost for local testing)
    const isLocalhost =
      parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
    if (parsed.protocol !== 'https:' && !(isLocalhost && process.env.NODE_ENV !== 'production')) {
      return false;
    }

    const config = getMarketplaceConfig(marketplace);
    if (!config) {
      return false;
    }

    const host = parsed.hostname.toLowerCase().replace(/\.$/, '');

    // Check if host matches allowed domains safely:
    // 1. Exact match (e.g., 'flipkart.com', 'fktr.in', 'trackingv3.linkredirect.in')
    // 2. Legitimate subdomain match (e.g., '*.flipkart.com', '*.fktr.in')
    // Specific full hostnames like 'trackingv3.linkredirect.in' must only match exactly.
    return config.allowedDomains.some((allowed) => {
      const allowedLower = allowed.toLowerCase();
      if (host === allowedLower) {
        return true;
      }
      // Exact hostname restriction: do not permit arbitrary subdomains on specific tracking hostnames
      if (allowedLower === 'trackingv3.linkredirect.in') {
        return false;
      }
      return host.endsWith('.' + allowedLower);
    });
  } catch {
    return false;
  }
}
