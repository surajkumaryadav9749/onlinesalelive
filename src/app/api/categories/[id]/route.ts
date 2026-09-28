import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Category } from '@/models/Category';
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
    const category = await Category.findOne(query).lean();

    if (!category) return errorResponse('Category not found', 404);
    return successResponse(category);
  } catch (err) {
    console.error('Error fetching category:', err instanceof Error ? err.message : err);
    return errorResponse('Failed to fetch category', 500);
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
    const existing = await Category.findOne(query);
    if (!existing) return errorResponse('Category not found', 404);

    if (body.slug && body.slug !== existing.slug) {
      const normalizedSlug = String(body.slug).trim().toLowerCase();
      const duplicate = await Category.findOne({
        slug: normalizedSlug,
        _id: { $ne: existing._id },
      });
      if (duplicate) {
        return errorResponse(`Category with slug '${normalizedSlug}' already exists`);
      }
      existing.slug = normalizedSlug;
    }

    if (body.name !== undefined) existing.name = String(body.name).trim();
    if (body.description !== undefined) existing.description = String(body.description).trim();
    if (body.icon !== undefined) existing.icon = String(body.icon).trim();
    if (body.image !== undefined) existing.image = String(body.image).trim();
    if (body.featured !== undefined) existing.featured = Boolean(body.featured);
    if (body.isActive !== undefined) existing.isActive = Boolean(body.isActive);

    await existing.save();
    return successResponse(existing);
  } catch (err) {
    console.error('Error updating category:', err instanceof Error ? err.message : err);
    return errorResponse('Failed to update category', 500);
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
    const category = await Category.findOne(query);
    if (!category) return errorResponse('Category not found', 404);

    // Relationship check: do not orphan products
    const productCount = await Product.countDocuments({ category: category._id });
    if (productCount > 0) {
      return errorResponse(
        `Cannot delete category '${category.name}' because ${productCount} products are linked to it. Reassign or delete those products first.`,
        400
      );
    }

    await Category.deleteOne({ _id: category._id });
    return successResponse({ message: 'Category deleted successfully', id: category._id });
  } catch (err) {
    console.error('Error deleting category:', err instanceof Error ? err.message : err);
    return errorResponse('Failed to delete category', 500);
  }
}
