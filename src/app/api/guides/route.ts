import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Guide } from '@/models/Guide';
import { checkAdminAuth, errorResponse, successResponse } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  try {
    const conn = await connectToDatabase();
    if (!conn) return errorResponse('Database connection failed', 503);

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const all = searchParams.get('all') === 'true';

    const filter: Record<string, unknown> = all ? {} : { isPublished: true };
    if (category) {
      filter.categorySlug = category.toLowerCase();
    }

    const guides = await Guide.find(filter).sort({ publishedAt: -1 }).lean();
    return successResponse(guides);
  } catch (err) {
    console.error('Error fetching guides:', err instanceof Error ? err.message : err);
    return errorResponse('Failed to fetch guides', 500);
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
      excerpt,
      content,
      category,
      categorySlug,
      author,
      readTime,
      image,
      topPicks,
      comparisonTable,
      pros,
      cons,
      buyingTips,
      relatedProductSlugs,
      isPublished,
      seoTitle,
      seoDescription,
    } = body;

    if (!title || !slug) {
      return errorResponse('Guide title and slug are required');
    }

    const normalizedSlug = String(slug).trim().toLowerCase();
    const existing = await Guide.findOne({ slug: normalizedSlug });
    if (existing) {
      return errorResponse(`Guide with slug '${normalizedSlug}' already exists`);
    }

    const guide = await Guide.create({
      title: String(title).trim(),
      slug: normalizedSlug,
      excerpt: excerpt || '',
      content: content || '',
      category: category || '',
      categorySlug: categorySlug ? String(categorySlug).toLowerCase() : '',
      author: author || 'Editorial Staff',
      readTime: readTime || '6 min read',
      image: image || '',
      topPicks: Array.isArray(topPicks) ? topPicks : [],
      comparisonTable: comparisonTable || { headers: [], rows: [] },
      pros: Array.isArray(pros) ? pros : [],
      cons: Array.isArray(cons) ? cons : [],
      buyingTips: Array.isArray(buyingTips) ? buyingTips : [],
      relatedProductSlugs: Array.isArray(relatedProductSlugs) ? relatedProductSlugs : [],
      isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
      seoTitle: seoTitle || '',
      seoDescription: seoDescription || '',
    });

    return successResponse(guide, 201);
  } catch (err) {
    console.error('Error creating guide:', err instanceof Error ? err.message : err);
    return errorResponse('Failed to create guide', 500);
  }
}
