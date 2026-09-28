import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Deal } from '@/models/Deal';
import { Product } from '@/models/Product';
import { checkAdminAuth, errorResponse, successResponse, isValidId } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  try {
    const conn = await connectToDatabase();
    if (!conn) return errorResponse('Database connection failed', 503);

    const { searchParams } = new URL(req.url);
    const dealType = searchParams.get('dealType');
    const marketplace = searchParams.get('marketplace');
    const status = searchParams.get('status');
    const all = searchParams.get('all') === 'true';

    const filter: Record<string, unknown> = all ? {} : { isActive: true };
    if (dealType && dealType !== 'all') {
      filter.dealType = dealType;
    }
    if (marketplace && marketplace !== 'all') {
      filter.marketplace = marketplace;
    }
    if (status && status !== 'all') {
      filter.status = status;
    }

    const deals = await Deal.find(filter)
      .populate('product', 'name slug price originalPrice image discountPercent')
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(deals);
  } catch (err) {
    console.error('Error fetching deals:', err instanceof Error ? err.message : err);
    return errorResponse('Failed to fetch deals', 500);
  }
}

export async function POST(req: NextRequest) {
  const { errorResponse: authError } = await checkAdminAuth();
  if (authError) return authError;

  try {
    const conn = await connectToDatabase();
    if (!conn) return errorResponse('Database connection failed', 503);

    const body = await req.json();
    const {
      title,
      slug,
      description,
      product,
      currentPrice,
      originalPrice,
      discountPercent,
      marketplace,
      marketplaceUrl,
      affiliateUrl,
      isAffiliate,
      dealType,
      endsIn,
      startDate,
      endDate,
      status,
      isFeatured,
      verified,
      isActive,
    } = body;

    if (!title || !slug) {
      return errorResponse('Deal title and slug are required');
    }

    const normalizedSlug = String(slug).trim().toLowerCase();
    const existing = await Deal.findOne({ slug: normalizedSlug });
    if (existing) {
      return errorResponse(`Deal with slug '${normalizedSlug}' already exists`);
    }

    let prodId;
    let prodSlug = '';
    if (product) {
      if (isValidId(product)) {
        const prodDoc = await Product.findById(product);
        if (prodDoc) {
          prodId = prodDoc._id;
          prodSlug = prodDoc.slug;
        }
      } else {
        const prodDoc = await Product.findOne({ slug: String(product).toLowerCase() });
        if (prodDoc) {
          prodId = prodDoc._id;
          prodSlug = prodDoc.slug;
        }
      }
    }

    const deal = await Deal.create({
      title: String(title).trim(),
      slug: normalizedSlug,
      description: description || '',
      product: prodId,
      productSlug: prodSlug,
      currentPrice: currentPrice ? Number(currentPrice) : 0,
      originalPrice: originalPrice ? Number(originalPrice) : 0,
      discountPercent: discountPercent ? Number(discountPercent) : 0,
      marketplace: marketplace || 'Amazon',
      marketplaceUrl: marketplaceUrl || '#',
      affiliateUrl: affiliateUrl || '',
      isAffiliate: Boolean(isAffiliate),
      dealType: dealType || "Today's Deal",
      endsIn: endsIn || '12h 00m',
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      status: status || 'active',
      isFeatured: Boolean(isFeatured),
      verified: verified !== undefined ? Boolean(verified) : true,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    return successResponse(deal, 201);
  } catch (err) {
    console.error('Error creating deal:', err instanceof Error ? err.message : err);
    return errorResponse('Failed to create deal', 500);
  }
}
