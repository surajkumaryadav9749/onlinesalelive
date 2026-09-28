import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Deal } from '@/models/Deal';
import { Product } from '@/models/Product';
import { checkAdminAuth, errorResponse, successResponse, isValidId } from '@/lib/api-helpers';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const conn = await connectToDatabase();
    if (!conn) return errorResponse('Database connection failed', 503);

    const { id } = await params;
    const query = isValidId(id) ? { _id: id } : { slug: id.toLowerCase() };
    const deal = await Deal.findOne(query).populate('product').lean();

    if (!deal) return errorResponse('Deal not found', 404);
    return successResponse(deal);
  } catch (err) {
    console.error('Error fetching deal:', err instanceof Error ? err.message : err);
    return errorResponse('Failed to fetch deal', 500);
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { errorResponse: authError } = await checkAdminAuth();
  if (authError) return authError;

  try {
    const conn = await connectToDatabase();
    if (!conn) return errorResponse('Database connection failed', 503);

    const { id } = await params;
    const body = await req.json();

    const query = isValidId(id) ? { _id: id } : { slug: id.toLowerCase() };
    const existing = await Deal.findOne(query);
    if (!existing) return errorResponse('Deal not found', 404);

    if (body.slug && body.slug !== existing.slug) {
      const normalizedSlug = String(body.slug).trim().toLowerCase();
      const duplicate = await Deal.findOne({
        slug: normalizedSlug,
        _id: { $ne: existing._id },
      });
      if (duplicate) {
        return errorResponse(`Deal with slug '${normalizedSlug}' already exists`);
      }
      existing.slug = normalizedSlug;
    }

    if (body.product) {
      if (isValidId(body.product)) {
        const prod = await Product.findById(body.product);
        if (prod) {
          existing.product = prod._id;
          existing.productSlug = prod.slug;
        }
      }
    }

    if (body.title !== undefined) existing.title = String(body.title).trim();
    if (body.description !== undefined) existing.description = String(body.description).trim();
    if (body.currentPrice !== undefined) existing.currentPrice = Number(body.currentPrice);
    if (body.originalPrice !== undefined) existing.originalPrice = Number(body.originalPrice);
    if (body.discountPercent !== undefined) existing.discountPercent = Number(body.discountPercent);
    if (body.marketplace !== undefined) existing.marketplace = body.marketplace;
    if (body.marketplaceUrl !== undefined) existing.marketplaceUrl = body.marketplaceUrl;
    if (body.affiliateUrl !== undefined) existing.affiliateUrl = body.affiliateUrl;
    if (body.isAffiliate !== undefined) existing.isAffiliate = Boolean(body.isAffiliate);
    if (body.dealType !== undefined) existing.dealType = body.dealType;
    if (body.endsIn !== undefined) existing.endsIn = body.endsIn;
    if (body.startDate !== undefined) existing.startDate = body.startDate ? new Date(body.startDate) : undefined;
    if (body.endDate !== undefined) existing.endDate = body.endDate ? new Date(body.endDate) : undefined;
    if (body.isFeatured !== undefined) existing.isFeatured = Boolean(body.isFeatured);
    if (body.verified !== undefined) existing.verified = Boolean(body.verified);
    if (body.status !== undefined) existing.status = body.status;
    if (body.isActive !== undefined) existing.isActive = Boolean(body.isActive);

    await existing.save();
    return successResponse(existing);
  } catch (err) {
    console.error('Error updating deal:', err instanceof Error ? err.message : err);
    return errorResponse('Failed to update deal', 500);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { errorResponse: authError } = await checkAdminAuth();
  if (authError) return authError;

  try {
    const conn = await connectToDatabase();
    if (!conn) return errorResponse('Database connection failed', 503);

    const { id } = await params;
    const query = isValidId(id) ? { _id: id } : { slug: id.toLowerCase() };
    const deal = await Deal.findOne(query);
    if (!deal) return errorResponse('Deal not found', 404);

    await Deal.deleteOne({ _id: deal._id });
    return successResponse({ message: 'Deal deleted successfully', id: deal._id });
  } catch (err) {
    console.error('Error deleting deal:', err instanceof Error ? err.message : err);
    return errorResponse('Failed to delete deal', 500);
  }
}
