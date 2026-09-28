import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Review } from '@/models/Review';
import { Product } from '@/models/Product';
import { checkAdminAuth, errorResponse, successResponse, isValidId } from '@/lib/api-helpers';
import { revalidateContent } from '@/lib/revalidate';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const conn = await connectToDatabase();
    if (!conn) return errorResponse('Database connection failed', 503);

    const { id } = await params;
    const query = isValidId(id) ? { _id: id } : { slug: id.toLowerCase() };
    const review = await Review.findOne(query).populate('product').lean();

    if (!review) return errorResponse('Review not found', 404);
    return successResponse(review);
  } catch (err) {
    console.error('Error fetching review:', err instanceof Error ? err.message : err);
    return errorResponse('Failed to fetch review', 500);
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
    const existing = await Review.findOne(query);
    if (!existing) return errorResponse('Review not found', 404);

    if (body.slug && body.slug !== existing.slug) {
      const normalizedSlug = String(body.slug).trim().toLowerCase();
      const duplicate = await Review.findOne({
        slug: normalizedSlug,
        _id: { $ne: existing._id },
      });
      if (duplicate) {
        return errorResponse(`Review with slug '${normalizedSlug}' already exists`);
      }
      existing.slug = normalizedSlug;
    }

    if (body.product) {
      const prodDoc = isValidId(body.product)
        ? await Product.findById(body.product)
        : await Product.findOne({ slug: String(body.product).toLowerCase() });
      if (prodDoc) {
        existing.product = prodDoc._id;
        existing.productSlug = prodDoc.slug;
        if (!existing.productName) existing.productName = prodDoc.name;
      }
    }

    if (body.title !== undefined) existing.title = String(body.title).trim();
    if (body.productName !== undefined) existing.productName = String(body.productName).trim();
    if (body.excerpt !== undefined) existing.excerpt = String(body.excerpt).trim();
    if (body.content !== undefined) existing.content = String(body.content);
    if (body.image !== undefined) existing.image = String(body.image).trim();
    if (body.rating !== undefined) existing.rating = Number(body.rating);
    if (body.verdict !== undefined) existing.verdict = String(body.verdict).trim();
    if (body.pros !== undefined) existing.pros = Array.isArray(body.pros) ? body.pros : [];
    if (body.cons !== undefined) existing.cons = Array.isArray(body.cons) ? body.cons : [];
    if (body.specifications !== undefined) existing.specifications = body.specifications;
    if (body.price !== undefined) existing.price = Number(body.price);
    if (body.originalPrice !== undefined) existing.originalPrice = Number(body.originalPrice);
    if (body.discountPercent !== undefined) existing.discountPercent = Number(body.discountPercent);
    if (body.marketplaces !== undefined) existing.marketplaces = Array.isArray(body.marketplaces) ? body.marketplaces : [];
    if (body.author !== undefined) existing.author = String(body.author).trim();
    if (body.isPublished !== undefined) existing.isPublished = Boolean(body.isPublished);
    if (body.seoTitle !== undefined) existing.seoTitle = body.seoTitle;
    if (body.seoDescription !== undefined) existing.seoDescription = body.seoDescription;

    await existing.save();
    revalidateContent('review', existing.slug);
    return successResponse(existing);
  } catch (err) {
    console.error('Error updating review:', err instanceof Error ? err.message : err);
    return errorResponse('Failed to update review', 500);
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
    const review = await Review.findOne(query);
    if (!review) return errorResponse('Review not found', 404);

    const reviewSlug = review.slug;
    await Review.deleteOne({ _id: review._id });
    revalidateContent('review', reviewSlug);
    return successResponse({ message: 'Review deleted successfully', id: review._id });
  } catch (err) {
    console.error('Error deleting review:', err instanceof Error ? err.message : err);
    return errorResponse('Failed to delete review', 500);
  }
}
