import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Category } from '@/models/Category';
import { checkAdminAuth, errorResponse, successResponse } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  try {
    const conn = await connectToDatabase();
    if (!conn) {
      return errorResponse('Database connection failed', 503);
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const all = searchParams.get('all') === 'true';

    const filter: Record<string, unknown> = all ? {} : { isActive: true };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
      ];
    }

    const categories = await Category.find(filter).sort({ name: 1 }).lean();
    return successResponse(categories);
  } catch (err) {
    console.error('Error fetching categories:', err instanceof Error ? err.message : err);
    return errorResponse('Failed to fetch categories', 500);
  }
}

export async function POST(req: NextRequest) {
  const { errorResponse: authError } = await checkAdminAuth();
  if (authError) return authError;

  try {
    const conn = await connectToDatabase();
    if (!conn) {
      return errorResponse('Database connection failed', 503);
    }

    const body = await req.json();
    const { name, slug, description, icon, image, featured, isActive } = body;

    if (!name || !slug) {
      return errorResponse('Category name and slug are required');
    }

    const normalizedSlug = String(slug).trim().toLowerCase();
    const existing = await Category.findOne({ slug: normalizedSlug });
    if (existing) {
      return errorResponse(`Category with slug '${normalizedSlug}' already exists`);
    }

    const category = await Category.create({
      name: String(name).trim(),
      slug: normalizedSlug,
      description: description || '',
      icon: icon || 'Tv',
      image: image || '',
      featured: Boolean(featured),
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    return successResponse(category, 201);
  } catch (err) {
    console.error('Error creating category:', err instanceof Error ? err.message : err);
    return errorResponse('Failed to create category', 500);
  }
}
