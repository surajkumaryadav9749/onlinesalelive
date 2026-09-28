import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Guide } from '@/models/Guide';
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
    const guide = await Guide.findOne(query).lean();

    if (!guide) return errorResponse('Guide not found', 404);
    return successResponse(guide);
  } catch (err) {
    console.error('Error fetching guide:', err instanceof Error ? err.message : err);
    return errorResponse('Failed to fetch guide', 500);
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
    const existing = await Guide.findOne(query);
    if (!existing) return errorResponse('Guide not found', 404);

    if (body.slug && body.slug !== existing.slug) {
      const normalizedSlug = String(body.slug).trim().toLowerCase();
      const duplicate = await Guide.findOne({
        slug: normalizedSlug,
        _id: { $ne: existing._id },
      });
      if (duplicate) {
        return errorResponse(`Guide with slug '${normalizedSlug}' already exists`);
      }
      existing.slug = normalizedSlug;
    }

    if (body.title !== undefined) existing.title = String(body.title).trim();
    if (body.excerpt !== undefined) existing.excerpt = String(body.excerpt).trim();
    if (body.content !== undefined) existing.content = String(body.content);
    if (body.category !== undefined) existing.category = String(body.category).trim();
    if (body.categorySlug !== undefined) existing.categorySlug = String(body.categorySlug).toLowerCase().trim();
    if (body.author !== undefined) existing.author = String(body.author).trim();
    if (body.readTime !== undefined) existing.readTime = String(body.readTime).trim();
    if (body.image !== undefined) existing.image = String(body.image).trim();
    if (body.topPicks !== undefined) existing.topPicks = Array.isArray(body.topPicks) ? body.topPicks : [];
    if (body.comparisonTable !== undefined) existing.comparisonTable = body.comparisonTable;
    if (body.pros !== undefined) existing.pros = Array.isArray(body.pros) ? body.pros : [];
    if (body.cons !== undefined) existing.cons = Array.isArray(body.cons) ? body.cons : [];
    if (body.buyingTips !== undefined) existing.buyingTips = Array.isArray(body.buyingTips) ? body.buyingTips : [];
    if (body.relatedProductSlugs !== undefined) existing.relatedProductSlugs = Array.isArray(body.relatedProductSlugs) ? body.relatedProductSlugs : [];
    if (body.isPublished !== undefined) existing.isPublished = Boolean(body.isPublished);
    if (body.seoTitle !== undefined) existing.seoTitle = body.seoTitle;
    if (body.seoDescription !== undefined) existing.seoDescription = body.seoDescription;

    await existing.save();
    return successResponse(existing);
  } catch (err) {
    console.error('Error updating guide:', err instanceof Error ? err.message : err);
    return errorResponse('Failed to update guide', 500);
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
    const guide = await Guide.findOne(query);
    if (!guide) return errorResponse('Guide not found', 404);

    await Guide.deleteOne({ _id: guide._id });
    return successResponse({ message: 'Guide deleted successfully', id: guide._id });
  } catch (err) {
    console.error('Error deleting guide:', err instanceof Error ? err.message : err);
    return errorResponse('Failed to delete guide', 500);
  }
}
