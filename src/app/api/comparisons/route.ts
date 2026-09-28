import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Comparison } from '@/models/Comparison';
import { checkAdminAuth, errorResponse, successResponse } from '@/lib/api-helpers';
import { revalidateContent } from '@/lib/revalidate';

export async function GET(req: NextRequest) {
  try {
    const conn = await connectToDatabase();
    if (!conn) return errorResponse('Database connection failed', 503);

    const { searchParams } = new URL(req.url);
    const all = searchParams.get('all') === 'true';

    const filter: Record<string, unknown> = all ? {} : { isPublished: true };
    const comparisons = await Comparison.find(filter)
      .populate('products', 'name slug price originalPrice image discountPercent category')
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(comparisons);
  } catch (err) {
    console.error('Error fetching comparisons:', err instanceof Error ? err.message : err);
    return errorResponse('Failed to fetch comparisons', 500);
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
      products,
      productSlugs,
      content,
      image,
      isPublished,
      seoTitle,
      seoDescription,
    } = body;

    if (!title || !slug) {
      return errorResponse('Comparison title and slug are required');
    }

    const normalizedSlug = String(slug).trim().toLowerCase();
    const existing = await Comparison.findOne({ slug: normalizedSlug });
    if (existing) {
      return errorResponse(`Comparison with slug '${normalizedSlug}' already exists`);
    }

    const comparison = await Comparison.create({
      title: String(title).trim(),
      slug: normalizedSlug,
      description: description || '',
      products: Array.isArray(products) ? products : [],
      productSlugs: Array.isArray(productSlugs) ? productSlugs : [],
      content: content || '',
      image: image || '',
      isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
      seoTitle: seoTitle || '',
      seoDescription: seoDescription || '',
    });

    revalidateContent('comparison', comparison.slug);
    return successResponse(comparison, 201);
  } catch (err) {
    console.error('Error creating comparison:', err instanceof Error ? err.message : err);
    return errorResponse('Failed to create comparison', 500);
  }
}
