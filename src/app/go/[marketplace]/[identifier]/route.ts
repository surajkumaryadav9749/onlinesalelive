import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { Product } from '@/models/Product';
import { Deal } from '@/models/Deal';
import { AffiliateClick } from '@/models/AffiliateClick';
import {
  getMarketplaceConfig,
  isAllowedMarketplaceUrl,
} from '@/lib/marketplaces';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ marketplace: string; identifier: string }> }
) {
  const { marketplace, identifier } = await context.params;

  if (!marketplace || !identifier) {
    return new NextResponse('Bad Request: Missing marketplace or identifier', { status: 400 });
  }

  // 1. Validate marketplace from configured registry
  const config = getMarketplaceConfig(marketplace);
  if (!config || !config.isEnabled) {
    return new NextResponse('Bad Request: Unsupported or disabled marketplace', { status: 404 });
  }

  try {
    await connectToDatabase();

    const isMongoId = mongoose.Types.ObjectId.isValid(identifier);
    const normalizedIdentifier = identifier.trim().toLowerCase();

    // 2. Look up product first
    const productQuery = isMongoId
      ? { $or: [{ _id: identifier }, { slug: normalizedIdentifier }], isActive: { $ne: false } }
      : { slug: normalizedIdentifier, isActive: { $ne: false } };

    const product = await Product.findOne(productQuery).lean();

    let destinationUrl = '';
    let isAffiliate = false;
    let productId: mongoose.Types.ObjectId | undefined;
    let productSlug = '';
    let productName = '';
    let dealId: mongoose.Types.ObjectId | undefined;
    let dealSlug = '';

    if (product) {
      productId = product._id as mongoose.Types.ObjectId;
      productSlug = product.slug;
      productName = product.name;

      // Find offer for this marketplace
      const offer = product.marketplaces?.find(
        (m) => m.name.toLowerCase() === config.name.toLowerCase()
      );

      if (offer && offer.isActive !== false) {
        if (offer.isAffiliate && offer.affiliateUrl && offer.affiliateUrl !== '#') {
          destinationUrl = offer.affiliateUrl.trim();
          isAffiliate = true;
        } else if (offer.url && offer.url !== '#') {
          destinationUrl = offer.url.trim();
          isAffiliate = false;
        }
      }
    } else {
      // 3. Look up deal if product wasn't found
      const dealQuery = isMongoId
        ? { $or: [{ _id: identifier }, { slug: normalizedIdentifier }], isActive: { $ne: false } }
        : { slug: normalizedIdentifier, isActive: { $ne: false } };

      const deal = await Deal.findOne(dealQuery).lean();

      if (deal && deal.marketplace.toLowerCase() === config.name.toLowerCase()) {
        dealId = deal._id as mongoose.Types.ObjectId;
        dealSlug = deal.slug;
        productSlug = deal.productSlug || '';
        productName = deal.title;

        if (deal.isAffiliate && deal.affiliateUrl && deal.affiliateUrl !== '#') {
          destinationUrl = deal.affiliateUrl.trim();
          isAffiliate = true;
        } else if (deal.marketplaceUrl && deal.marketplaceUrl !== '#') {
          destinationUrl = deal.marketplaceUrl.trim();
          isAffiliate = false;
        }
      }
    }

    // 4. If no valid destination URL found, safely redirect back to product page or catalog
    if (!destinationUrl) {
      const fallbackUrl = productSlug
        ? new URL(`/product/${productSlug}?unavailable=true`, request.url)
        : new URL('/products', request.url);
      return NextResponse.redirect(fallbackUrl, {
        status: 302,
        headers: { 'X-Robots-Tag': 'noindex, nofollow' },
      });
    }

    // 5. Open-redirect security protection: validate allowed domain for this marketplace
    if (!isAllowedMarketplaceUrl(config.name, destinationUrl)) {
      console.warn(
        `[Security Alert] Blocked open-redirect attempt for marketplace ${config.name} to target: ${destinationUrl}`
      );
      return new NextResponse('Bad Request: Redirection destination not allowed for this marketplace', {
        status: 400,
        headers: { 'X-Robots-Tag': 'noindex, nofollow' },
      });
    }

    // 6. Record affiliate click if tracking is enabled
    if (config.trackingEnabled) {
      const searchParams = request.nextUrl.searchParams;
      const sourcePage = searchParams.get('source') || request.headers.get('referer') || '';
      const rawUserAgent = request.headers.get('user-agent') || '';
      const userAgent = rawUserAgent.slice(0, 150); // truncated, no PII

      // Non-blocking log to ensure low-latency redirect
      AffiliateClick.create({
        product: productId,
        productSlug,
        productName,
        deal: dealId,
        dealSlug,
        marketplace: config.name,
        destinationUrl,
        isAffiliate,
        sourcePage: sourcePage.slice(0, 200),
        referrer: (request.headers.get('referer') || '').slice(0, 200),
        userAgent,
        createdAt: new Date(),
      }).catch((err) => {
        console.error('[AffiliateClick] Failed to record click:', err);
      });
    }

    // 7. Temporary redirect (307) preserving HTTP method, with anti-indexing header
    return NextResponse.redirect(destinationUrl, {
      status: 307,
      headers: { 'X-Robots-Tag': 'noindex, nofollow' },
    });
  } catch (error) {
    console.error('[Go Redirect] Error resolving link:', error);
    return NextResponse.redirect(new URL('/products', request.url), {
      status: 302,
      headers: { 'X-Robots-Tag': 'noindex, nofollow' },
    });
  }
}
