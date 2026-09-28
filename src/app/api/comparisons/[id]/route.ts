import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Comparison } from '@/models/Comparison';
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
    const comparison = await Comparison.findOne(query).populate('products').lean();

    if (!comparison) return errorResponse('Comparison not found', 404);
    return successResponse(comparison);
  } catch (err) {
    console.error('Error fetching comparison:', err instanceof Error ? err.message : err);
    return errorResponse('Failed to fetch comparison', 500);
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
    const existing = await Comparison.findOne(query);
    if (!existing) return errorResponse('Comparison not found', 404);

    if (body.slug && body.slug !== existing.slug) {
      const normalizedSlug = String(body.slug).trim().toLowerCase();
      const duplicate = await Comparison.findOne({
        slug: normalizedSlug,
        _id: { $ne: existing._id },
      });
      if (duplicate) {
        return errorResponse(`Comparison with slug '${normalizedSlug}' already exists`);
      }
      existing.slug = normalizedSlug;
    }

    if (body.title !== undefined) existing.title = String(body.title).trim();
    if (body.description !== undefined) existing.description = String(body.description).trim();
    if (body.content !== undefined) existing.content = String(body.content);
    if (body.image !== undefined) existing.image = String(body.image).trim();
    if (body.products !== undefined) existing.products = Array.isArray(body.products) ? body.products : [];
    if (body.productSlugs !== undefined) existing.productSlugs = Array.isArray(body.productSlugs) ? body.productSlugs : [];
    if (body.isPublished !== undefined) existing.isPublished = Boolean(body.isPublished);
    if (body.seoTitle !== undefined) existing.seoTitle = body.seoTitle;
    if (body.seoDescription !== undefined) existing.seoDescription = body.seoDescription;

    await existing.save();
    return successResponse(existing);
  } catch (err) {
    console.error('Error updating comparison:', err instanceof Error ? err.message : err);
    return errorResponse('Failed to update comparison', 500);
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
    const comparison = await Comparison.findOne(query);
    if (!comparison) return errorResponse('Comparison not found', 404);

    await Comparison.deleteOne({ _id: comparison._id });
    return successResponse({ message: 'Comparison deleted successfully', id: comparison._id });
  } catch (err) {
    console.error('Error deleting comparison:', err instanceof Error ? err.message : err);
    return errorResponse('Failed to delete comparison', 500);
  }
}
