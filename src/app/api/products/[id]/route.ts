import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Product } from '@/models/Product';
import { Category } from '@/models/Category';
import { Deal } from '@/models/Deal';
import { Review } from '@/models/Review';
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
    const product = await Product.findOne(query).populate('category', 'name slug icon').lean();

    if (!product) return errorResponse('Product not found', 404);
    return successResponse(product);
  } catch (err) {
    console.error('Error fetching product:', err instanceof Error ? err.message : err);
    return errorResponse('Failed to fetch product', 500);
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
    const existing = await Product.findOne(query);
    if (!existing) return errorResponse('Product not found', 404);

    if (body.slug && body.slug !== existing.slug) {
      const normalizedSlug = String(body.slug).trim().toLowerCase();
      const duplicate = await Product.findOne({
        slug: normalizedSlug,
        _id: { $ne: existing._id },
      });
      if (duplicate) {
        return errorResponse(`Product with slug '${normalizedSlug}' already exists`);
      }
      existing.slug = normalizedSlug;
    }

    if (body.category) {
      let categoryDoc;
      if (isValidId(body.category)) {
        categoryDoc = await Category.findById(body.category);
      } else {
        categoryDoc = await Category.findOne({ slug: String(body.category).toLowerCase() });
      }
      if (categoryDoc) {
        existing.category = categoryDoc._id;
        existing.categorySlug = categoryDoc.slug;
      }
    }

    if (body.name !== undefined) existing.name = String(body.name).trim();
    if (body.description !== undefined) existing.description = String(body.description).trim();
    if (body.image !== undefined) existing.image = String(body.image).trim();
    if (body.images !== undefined) existing.images = Array.isArray(body.images) ? body.images : [body.image || existing.image];
    if (body.price !== undefined) existing.price = Number(body.price);
    if (body.originalPrice !== undefined) existing.originalPrice = Number(body.originalPrice);

    if (existing.originalPrice > existing.price) {
      existing.discountPercent = Math.round(
        ((existing.originalPrice - existing.price) / existing.originalPrice) * 100
      );
    } else {
      existing.discountPercent = body.discountPercent !== undefined ? Number(body.discountPercent) : 0;
    }

    if (body.rating !== undefined) existing.rating = Number(body.rating);
    if (body.reviewCount !== undefined) existing.reviewCount = Number(body.reviewCount);
    if (body.pros !== undefined) existing.pros = Array.isArray(body.pros) ? body.pros : [];
    if (body.cons !== undefined) existing.cons = Array.isArray(body.cons) ? body.cons : [];
    if (body.specifications !== undefined) existing.specifications = body.specifications;
    if (body.marketplaces !== undefined) existing.marketplaces = Array.isArray(body.marketplaces) ? body.marketplaces : [];
    if (body.dealType !== undefined) existing.dealType = body.dealType;
    if (body.isFeatured !== undefined) existing.isFeatured = Boolean(body.isFeatured);
    if (body.isTrending !== undefined) existing.isTrending = Boolean(body.isTrending);
    if (body.badgeText !== undefined) existing.badgeText = body.badgeText;
    if (body.isActive !== undefined) existing.isActive = Boolean(body.isActive);

    await existing.save();
    return successResponse(existing);
  } catch (err) {
    console.error('Error updating product:', err instanceof Error ? err.message : err);
    return errorResponse('Failed to update product', 500);
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
    const product = await Product.findOne(query);
    if (!product) return errorResponse('Product not found', 404);

    // Relationship check: warn or clean up associated deals & reviews
    const dealCount = await Deal.countDocuments({ product: product._id });
    const reviewCount = await Review.countDocuments({ product: product._id });

    if (dealCount > 0 || reviewCount > 0) {
      return errorResponse(
        `Cannot delete product '${product.name}' because ${dealCount} deals and ${reviewCount} reviews reference it. Remove or reassign them first.`,
        400
      );
    }

    await Product.deleteOne({ _id: product._id });
    return successResponse({ message: 'Product deleted successfully', id: product._id });
  } catch (err) {
    console.error('Error deleting product:', err instanceof Error ? err.message : err);
    return errorResponse('Failed to delete product', 500);
  }
}
